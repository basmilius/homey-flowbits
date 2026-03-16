import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { MAX_TIMEOUT_MS, REALTIME_FLAGS_UPDATE, SETTING_FLAG_LAST_UPDATES, SETTING_FLAG_LOOKS, SETTING_FLAGS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { ClockUnit, Feature, Flag, FlowBitsApp, Look, Styleable } from '../types';
import { convertDurationToMs } from '../util';

export default class Flags extends Shortcuts<FlowBitsApp> implements Feature<Flag>, Styleable {
    #deactivationTimeouts: Map<string, NodeJS.Timeout> = new Map();
    #currentFlags: string[] = [];
    #looks: Record<string, Look> = {};
    #lastUpdates: Record<string, DateTime> = {};

    async initialize(): Promise<void> {
        this.#currentFlags = this.settings.get(SETTING_FLAGS) ?? [];
        this.#looks = this.settings.get(SETTING_FLAG_LOOKS) ?? {};
        this.#lastUpdates = Object.fromEntries(
            Object.entries<string>(this.settings.get(SETTING_FLAG_LAST_UPDATES) ?? {})
                .map(([key, value]) => [key, DateTime.fromISO(value)])
        );
    }

    get currentFlags(): string[] {
        return this.#currentFlags;
    }

    get looks(): Record<string, Look> {
        return this.#looks;
    }

    set looks(value: Record<string, Look>) {
        this.#looks = value;
        this.settings.set(SETTING_FLAG_LOOKS, value);
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused flags...');

        const provider = this.#autocompleteProvider();
        const definedNames = new Set(provider.values);

        this.#currentFlags = this.#currentFlags.filter(flag => definedNames.has(flag));
        this.settings.set(SETTING_FLAGS, this.#currentFlags);

        for (const key of Object.keys(this.#looks)) {
            if (definedNames.has(key)) {
                continue;
            }

            this.log(`Deleting unused flag look ${key}...`);
            delete this.#looks[key];
        }

        this.settings.set(SETTING_FLAG_LOOKS, this.#looks);

        for (const key of Object.keys(this.#lastUpdates)) {
            if (definedNames.has(key)) {
                continue;
            }

            this.log(`Deleting unused flag last update ${key}...`);
            delete this.#lastUpdates[key];
        }

        this.#persistLastUpdates();
    }

    async count(): Promise<number> {
        return this.#autocompleteProvider().values.length;
    }

    async find(name: string): Promise<Flag | null> {
        const provider = this.#autocompleteProvider();

        if (!provider.values.includes(name)) {
            return null;
        }

        const look = this.getLook(name);

        return {
            active: this.#currentFlags.includes(name),
            color: look[0],
            icon: look[1],
            lastUpdate: this.#lastUpdates[name]?.toISO() ?? undefined,
            name
        };
    }

    async findAll(): Promise<Flag[]> {
        const provider = this.#autocompleteProvider();
        const flags = await provider.find('');

        return flags.map(flag => {
            const look = this.getLook(flag.name);

            return {
                active: this.#currentFlags.includes(flag.name),
                color: look[0],
                icon: look[1],
                lastUpdate: this.#lastUpdates[flag.name]?.toISO() ?? undefined,
                name: flag.name
            };
        });
    }

    async activate(name: string): Promise<void> {
        if (!name || this.#currentFlags.includes(name)) {
            return;
        }

        this.#clearFlagTimeout(name);

        this.#currentFlags = [...this.#currentFlags, name];
        this.settings.set(SETTING_FLAGS, this.#currentFlags);
        this.#setLastUpdate(name);

        this.log(`Activate flag ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerActivated(name),
            this.#triggerChanged(name, true)
        ]);
    }

    async deactivate(name: string): Promise<void> {
        if (!name || !this.#currentFlags.includes(name)) {
            return;
        }

        this.#clearFlagTimeout(name);

        this.#currentFlags = this.#currentFlags.filter(f => f !== name);
        this.settings.set(SETTING_FLAGS, this.#currentFlags);
        this.#setLastUpdate(name);

        this.log(`Deactivate flag ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerDeactivated(name),
            this.#triggerChanged(name, false)
        ]);
    }

    async toggle(name: string): Promise<void> {
        if (this.#currentFlags.includes(name)) {
            await this.deactivate(name);
        } else {
            await this.activate(name);
        }
    }

    async activateFor(name: string, duration: number, unit: ClockUnit): Promise<void> {
        if (!name) {
            return;
        }

        this.#clearFlagTimeout(name);
        await this.activate(name);
        this.#scheduleDeactivation(name, duration, unit);

        this.log(`Activated flag ${name} for ${duration} ${unit}.`);
    }

    async isActiveFor(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.#lastUpdates[name];

        if (!lastUpdate) {
            return false;
        }

        if (!this.#currentFlags.includes(name)) {
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

        if (this.#currentFlags.includes(name)) {
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
        this.settings.set(SETTING_FLAG_LOOKS, this.#looks);

        await this.#triggerRealtime();
    }

    async update(): Promise<void> {
        await this.#triggerRealtime();
    }

    #setLastUpdate(name: string): void {
        this.#lastUpdates[name] = DateTime.now();
        this.#persistLastUpdates();
    }

    #persistLastUpdates(): void {
        this.settings.set(SETTING_FLAG_LAST_UPDATES, Object.fromEntries(
            Object.entries(this.#lastUpdates).flatMap(([key, dt]) => {
                const iso = dt.toISO();
                return iso ? [[key, iso]] : [];
            })
        ));
    }

    #clearFlagTimeout(name: string): void {
        const existingTimeout = this.#deactivationTimeouts.get(name);
        if (existingTimeout) {
            this.clearTimeout(existingTimeout);
            this.#deactivationTimeouts.delete(name);
        }
    }

    #scheduleDeactivation(name: string, duration: number, unit: ClockUnit): void {
        const ms = Math.min(convertDurationToMs(duration, unit), MAX_TIMEOUT_MS);

        const timeout = this.setTimeout(async () => {
            this.#deactivationTimeouts.delete(name);
            await this.deactivate(name);
        }, ms);

        this.#deactivationTimeouts.set(name, timeout);
    }

    async #triggerActivated(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.FlagActivated)
            ?.trigger({name});
    }

    async #triggerChanged(name: string, active: boolean): Promise<void> {
        this.registry
            .findTrigger(Triggers.FlagChanged)
            ?.trigger({name}, {active});
    }

    async #triggerDeactivated(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.FlagDeactivated)
            ?.trigger({name});
    }

    async #triggerRealtime(): Promise<void> {
        this.realtime(REALTIME_FLAGS_UPDATE);
    }

    #autocompleteProvider(): AutocompleteProviders.Flag {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.Flag);

        if (!provider) {
            throw new Error('Failed to get the flag autocomplete provider.');
        }

        return provider;
    }
}
