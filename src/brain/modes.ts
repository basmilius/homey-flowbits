import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { MAX_TIMEOUT_MS, REALTIME_MODE_UPDATE, SETTING_MODE, SETTING_MODE_LAST_UPDATES, SETTING_MODE_LOOKS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { ClockUnit, Feature, FlowBitsApp, Look, Mode, Styleable } from '../types';
import { convertDurationToMs } from '../util';

export default class Modes extends Shortcuts<FlowBitsApp> implements Feature<Mode>, Styleable {
    #deactivationTimeout: NodeJS.Timeout | null = null;
    #currentMode: string | null = null;
    #looks: Record<string, Look> = {};
    #lastUpdates: Record<string, DateTime> = {};

    async initialize(): Promise<void> {
        this.#currentMode = this.settings.get(SETTING_MODE) ?? null;
        this.#looks = this.settings.get(SETTING_MODE_LOOKS) ?? {};
        this.#lastUpdates = Object.fromEntries(
            Object.entries<string>(this.settings.get(SETTING_MODE_LAST_UPDATES) ?? {})
                .map(([key, value]) => [key, DateTime.fromISO(value)])
        );
    }

    get currentMode(): string | null {
        return this.#currentMode;
    }

    get looks(): Record<string, Look> {
        return this.#looks;
    }

    set looks(value: Record<string, Look>) {
        this.#looks = value;
        this.settings.set(SETTING_MODE_LOOKS, value);
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused modes...');

        const provider = this.#autocompleteProvider();
        const definedNames = new Set(provider.values);

        if (this.#currentMode && !definedNames.has(this.#currentMode)) {
            this.#currentMode = null;
            this.settings.set(SETTING_MODE, null);
        }

        for (const key of Object.keys(this.#looks)) {
            if (definedNames.has(key)) {
                continue;
            }

            this.log(`Deleting unused mode look ${key}...`);
            delete this.#looks[key];
        }

        this.settings.set(SETTING_MODE_LOOKS, this.#looks);

        for (const key of Object.keys(this.#lastUpdates)) {
            if (definedNames.has(key)) {
                continue;
            }

            this.log(`Deleting unused mode last update ${key}...`);
            delete this.#lastUpdates[key];
        }

        this.#persistLastUpdates();
    }

    async count(): Promise<number> {
        return this.#autocompleteProvider().values.length;
    }

    async find(name: string): Promise<Mode | null> {
        const provider = this.#autocompleteProvider();

        if (!provider.values.includes(name)) {
            return null;
        }

        const look = this.getLook(name);

        return {
            active: this.#currentMode === name,
            color: look[0],
            icon: look[1],
            lastUpdate: this.#lastUpdates[name]?.toISO() ?? undefined,
            name
        };
    }

    async findAll(): Promise<Mode[]> {
        const provider = this.#autocompleteProvider();
        const modes = await provider.find('');

        if (modes.length === 0) {
            return [];
        }

        return modes.map(mode => {
            const look = this.getLook(mode.name);

            return {
                active: this.#currentMode === mode.name,
                color: look[0],
                icon: look[1],
                lastUpdate: this.#lastUpdates[mode.name]?.toISO() ?? undefined,
                name: mode.name
            };
        });
    }

    async activate(name: string): Promise<void> {
        if (!name || this.#currentMode === name) {
            return;
        }

        this.#clearModeTimeout();

        const previous = this.#currentMode;

        if (previous !== null) {
            await this.#triggerDeactivated(previous);
        }

        const now = DateTime.now();

        this.#currentMode = name;
        this.settings.set(SETTING_MODE, name);

        this.#lastUpdates[name] = now;
        if (previous !== null) {
            this.#lastUpdates[previous] = now;
        }
        this.#persistLastUpdates();

        this.log(`Activate mode ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerActivated(name),
            this.#triggerChanged(name, true)
        ]);
    }

    async deactivate(name: string): Promise<void> {
        if (!name || this.#currentMode !== name) {
            return;
        }

        this.#clearModeTimeout();

        this.#currentMode = null;
        this.settings.set(SETTING_MODE, null);

        this.#lastUpdates[name] = DateTime.now();
        this.#persistLastUpdates();

        this.log(`Deactivate mode ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerDeactivated(name),
            this.#triggerChanged(name, false)
        ]);
    }

    async reactivate(name: string): Promise<void> {
        if (!name) {
            return;
        }

        this.#clearModeTimeout();

        this.#currentMode = name;
        this.settings.set(SETTING_MODE, name);

        this.#lastUpdates[name] = DateTime.now();
        this.#persistLastUpdates();

        this.log(`Reactivate mode ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerActivated(name),
            this.#triggerChanged(name, true)
        ]);
    }

    async reactivateCurrent(): Promise<void> {
        if (this.#currentMode === null) {
            this.log('No current mode to reactivate.');
            return;
        }

        await this.reactivate(this.#currentMode);
    }

    async toggle(name: string): Promise<void> {
        if (this.#currentMode === name) {
            await this.deactivate(name);
        } else {
            await this.activate(name);
        }
    }

    async activateFor(name: string, duration: number, unit: ClockUnit): Promise<void> {
        if (!name) {
            return;
        }

        this.#clearModeTimeout();
        await this.activate(name);
        this.#scheduleDeactivation(name, duration, unit);

        this.log(`Activated mode ${name} for ${duration} ${unit}.`);
    }

    async isActiveFor(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.#lastUpdates[name];

        if (!lastUpdate) {
            return false;
        }

        if (this.#currentMode !== name) {
            return false;
        }

        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return lastUpdate <= cutoff;
    }

    async isInactiveFor(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.#lastUpdates[name];

        if (!lastUpdate) {
            return true;
        }

        if (this.#currentMode === name) {
            return false;
        }

        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return lastUpdate <= cutoff;
    }

    getLook(name: string): Look {
        return this.#looks[name] ?? ['#204ef6', ''];
    }

    async setLook(name: string, look: Look): Promise<void> {
        this.#looks[name] = look;
        this.settings.set(SETTING_MODE_LOOKS, this.#looks);

        await this.#triggerRealtime();
    }

    async update(): Promise<void> {
        await this.#triggerRealtime();
    }

    #persistLastUpdates(): void {
        this.settings.set(SETTING_MODE_LAST_UPDATES, Object.fromEntries(
            Object.entries(this.#lastUpdates).flatMap(([key, dt]) => {
                const iso = dt.toISO();
                return iso ? [[key, iso]] : [];
            })
        ));
    }

    #clearModeTimeout(): void {
        if (this.#deactivationTimeout) {
            this.clearTimeout(this.#deactivationTimeout);
            this.#deactivationTimeout = null;
        }
    }

    #scheduleDeactivation(name: string, duration: number, unit: ClockUnit): void {
        const ms = Math.min(convertDurationToMs(duration, unit), MAX_TIMEOUT_MS);

        this.#deactivationTimeout = this.setTimeout(async () => {
            this.#deactivationTimeout = null;
            await this.deactivate(name);
        }, ms);
    }

    async #triggerActivated(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.ModeActivated)
            ?.trigger({name});

        await this.notify(this.translate('notification.mode_activated', {name}));
    }

    async #triggerChanged(name: string, active: boolean): Promise<void> {
        this.registry
            .findTrigger(Triggers.ModeCurrentChanged)
            ?.trigger({}, {mode: active ? name : '-'});

        this.registry
            .findTrigger(Triggers.ModeChanged)
            ?.trigger({name}, {active});
    }

    async #triggerDeactivated(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.ModeDeactivated)
            ?.trigger({name});

        await this.notify(this.translate('notification.mode_deactivated', {name}));
    }

    async #triggerRealtime(): Promise<void> {
        this.realtime(REALTIME_MODE_UPDATE);
    }

    #autocompleteProvider(): AutocompleteProviders.Mode {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.Mode);

        if (!provider) {
            throw new Error('Failed to get the mode autocomplete provider.');
        }

        return provider;
    }
}
