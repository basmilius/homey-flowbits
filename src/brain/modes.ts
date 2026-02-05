import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { MAX_TIMEOUT_MS, REALTIME_MODE_UPDATE, SETTING_MODE, SETTING_MODE_LAST_UPDATES, SETTING_MODE_LOOKS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { ClockUnit, Feature, FlowBitsApp, Look, Mode, Styleable } from '../types';
import { convertDurationToSeconds } from '../util';

export default class Modes extends Shortcuts<FlowBitsApp> implements Feature<Mode>, Styleable {
    #deactivationTimeout: NodeJS.Timeout | null = null;

    get currentMode(): string | null {
        return this.settings.get(SETTING_MODE);
    }

    set currentMode(value: string | null) {
        this.settings.set(SETTING_MODE, value);
    }

    get looks(): Record<string, Look> {
        return this.settings.get(SETTING_MODE_LOOKS) ?? {};
    }

    set looks(value: Record<string, Look>) {
        this.settings.set(SETTING_MODE_LOOKS, value);
    }

    get lastUpdates(): Record<string, DateTime> {
        return Object.fromEntries(
            Object.entries<string>(this.settings.get(SETTING_MODE_LAST_UPDATES) ?? {})
                .map(([key, value]) => [
                    key,
                    DateTime.fromISO(value)
                ])
        );
    }

    set lastUpdates(value: Record<string, DateTime>) {
        this.settings.set(SETTING_MODE_LAST_UPDATES, Object.fromEntries(
            Object.entries(value)
                .map(([key, value]) => [
                    key,
                    value.toISO()
                ])
        ));
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused modes...');

        const defined = await this.findAll();
        const looks = this.looks;
        const lastUpdates = this.lastUpdates;

        if (this.currentMode && !defined.find(d => d.name === this.currentMode)) {
            this.currentMode = null;
        }

        for (const key of Object.keys(this.looks)) {
            if (defined.find(d => d.name === key)) {
                continue;
            }

            this.log(`Deleting unused mode look ${key}...`);
            delete looks[key];
        }

        for (const key of Object.keys(this.lastUpdates)) {
            if (defined.find(d => d.name === key)) {
                continue;
            }

            this.log(`Deleting unused mode last update ${key}...`);
            delete lastUpdates[key];
        }

        this.looks = looks;
        this.lastUpdates = lastUpdates;
    }

    async count(): Promise<number> {
        const modes = await this.findAll();

        return modes.length;
    }

    async find(name: string): Promise<Mode | null> {
        const modes = await this.findAll();
        const mode = modes.find(mode => mode.name === name);

        return mode ?? null;
    }

    async findAll(): Promise<Mode[]> {
        const provider = this.#autocompleteProvider();
        const current = this.currentMode;
        const lastUpdates = this.lastUpdates;
        const modes = await provider.find('');

        if (modes.length === 0) {
            return [];
        }

        const results: Mode[] = [];

        for (const mode of modes) {
            const look = await this.getLook(mode.name);
            const lastUpdate = lastUpdates[mode.name];

            results.push({
                active: current === mode.name,
                color: look[0],
                icon: look[1],
                lastUpdate: lastUpdate?.toISO() ?? undefined,
                name: mode.name
            });
        }

        return results;
    }

    async activate(name: string): Promise<void> {
        const current = this.currentMode;

        if (current === name) {
            return;
        }

        // Clear any existing timeout
        this.#clearModeTimeout();

        if (current !== null) {
            await this.#triggerDeactivated(current);
        }

        this.currentMode = name;
        
        const now = DateTime.now();
        const updates = {...this.lastUpdates, [name]: now};
        
        // Also update the timestamp for the previously active mode
        if (current !== null) {
            updates[current] = now;
        }
        
        this.lastUpdates = updates;

        this.log(`Activate mode ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerActivated(name),
            this.#triggerChanged(name, true)
        ]);
    }

    async deactivate(name: string): Promise<void> {
        const current = this.currentMode;

        if (current !== name) {
            return;
        }

        // Clear any existing timeout
        this.#clearModeTimeout();

        this.currentMode = null;
        this.lastUpdates = {
            ...this.lastUpdates,
            [name]: DateTime.now()
        };

        this.log(`Deactivate mode ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerDeactivated(name),
            this.#triggerChanged(name, false)
        ]);
    }

    async reactivate(name: string): Promise<void> {
        // Clear any existing timeout
        this.#clearModeTimeout();

        this.currentMode = name;
        this.lastUpdates = {
            ...this.lastUpdates,
            [name]: DateTime.now()
        };

        this.log(`Reactivate mode ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerActivated(name),
            this.#triggerChanged(name, true)
        ]);
    }

    async reactivateCurrent(): Promise<void> {
        const current = this.currentMode;

        if (current === null) {
            this.log('No current mode to reactivate.');
            return;
        }

        await this.reactivate(current);
    }

    async toggle(name: string): Promise<void> {
        if (this.currentMode === name) {
            await this.deactivate(name);
        } else {
            await this.activate(name);
        }
    }

    async activateFor(name: string, duration: number, unit: ClockUnit): Promise<void> {
        // Clear any existing timeout
        this.#clearModeTimeout();

        // Activate the mode
        await this.activate(name);

        // Schedule deactivation
        this.#scheduleDeactivation(name, duration, unit);

        this.log(`Activated mode ${name} for ${duration} ${unit}.`);
    }

    async isActiveFor(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.lastUpdates[name];
        
        if (!lastUpdate) {
            return false;
        }

        const isActive = this.currentMode === name;
        if (!isActive) {
            return false;
        }

        const seconds = convertDurationToSeconds(duration, unit);
        const cutoff = DateTime.now().minus({seconds});

        return lastUpdate <= cutoff;
    }

    async isInactiveFor(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.lastUpdates[name];
        
        if (!lastUpdate) {
            // If there's no lastUpdate, the mode has never been touched, so consider it inactive forever
            return true;
        }

        const isActive = this.currentMode === name;
        if (isActive) {
            return false;
        }

        const seconds = convertDurationToSeconds(duration, unit);
        const cutoff = DateTime.now().minus({seconds});

        return lastUpdate <= cutoff;
    }

    async getLook(name: string): Promise<Look> {
        return this.looks[name] ?? ['#204ef6', ''];
    }

    async setLook(name: string, look: Look): Promise<void> {
        this.looks = {
            ...this.looks,
            [name]: look
        };

        await this.#triggerRealtime();
    }

    async update(): Promise<void> {
        await this.#triggerRealtime();
    }

    #clearModeTimeout(): void {
        if (this.#deactivationTimeout) {
            this.clearTimeout(this.#deactivationTimeout);
            this.#deactivationTimeout = null;
        }
    }

    #scheduleDeactivation(name: string, duration: number, unit: ClockUnit): void {
        const seconds = convertDurationToSeconds(duration, unit);
        const ms = Math.min(seconds * 1000, MAX_TIMEOUT_MS);

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
