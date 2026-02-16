import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { MAX_TIMEOUT_MS, REALTIME_FLAGS_UPDATE, SETTING_FLAG_LAST_UPDATES, SETTING_FLAG_LOOKS, SETTING_FLAGS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { ClockUnit, Feature, Flag, FlowBitsApp, Look, Styleable } from '../types';
import { convertDurationToMs } from '../util';

export default class Flags extends Shortcuts<FlowBitsApp> implements Feature<Flag>, Styleable {
    #deactivationTimeouts: Map<string, NodeJS.Timeout> = new Map();

    get currentFlags(): string[] {
        return this.settings.get(SETTING_FLAGS) ?? [];
    }

    set currentFlags(value: string[]) {
        this.settings.set(SETTING_FLAGS, value);
    }

    get looks(): Record<string, Look> {
        return this.settings.get(SETTING_FLAG_LOOKS) ?? {};
    }

    set looks(value: Record<string, Look>) {
        this.settings.set(SETTING_FLAG_LOOKS, value);
    }

    get lastUpdates(): Record<string, DateTime> {
        return Object.fromEntries(
            Object.entries<string>(this.settings.get(SETTING_FLAG_LAST_UPDATES) ?? {})
                .map(([key, value]) => [
                    key,
                    DateTime.fromISO(value)
                ])
        );
    }

    set lastUpdates(value: Record<string, DateTime>) {
        this.settings.set(SETTING_FLAG_LAST_UPDATES, Object.fromEntries(
            Object.entries(value)
                .map(([key, value]) => [
                    key,
                    value.toISO()
                ])
        ));
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused flags...');

        const defined = await this.findAll();
        const looks = this.looks;
        const lastUpdates = this.lastUpdates;

        this.currentFlags = this.currentFlags.filter(flag => defined.find(d => d.name === flag));

        for (const key of Object.keys(this.looks)) {
            if (defined.find(d => d.name === key)) {
                continue;
            }

            this.log(`Deleting unused flag look ${key}...`);
            delete looks[key];
        }

        for (const key of Object.keys(this.lastUpdates)) {
            if (defined.find(d => d.name === key)) {
                continue;
            }

            this.log(`Deleting unused flag last update ${key}...`);
            delete lastUpdates[key];
        }

        this.looks = looks;
        this.lastUpdates = lastUpdates;
    }

    async count(): Promise<number> {
        const flags = await this.findAll();

        return flags.length;
    }

    async find(name: string): Promise<Flag | null> {
        const flags = await this.findAll();
        const flag = flags.find(flag => flag.name === name);

        return flag ?? null;
    }

    async findAll(): Promise<Flag[]> {
        const provider = this.#autocompleteProvider();
        const current = this.currentFlags;
        const lastUpdates = this.lastUpdates;
        const flags = await provider.find('');

        if (flags.length === 0) {
            return [];
        }

        const results: Flag[] = [];

        for (const flag of flags) {
            const look = await this.getLook(flag.name);
            const lastUpdate = lastUpdates[flag.name];

            results.push({
                active: current.includes(flag.name),
                color: look[0],
                icon: look[1],
                lastUpdate: lastUpdate?.toISO() ?? undefined,
                name: flag.name
            });
        }

        return results;
    }

    async activate(name: string): Promise<void> {
        const current = this.currentFlags;

        if (current.includes(name)) {
            return;
        }

        // Clear any existing timeout for this flag
        this.#clearFlagTimeout(name);

        this.currentFlags = [...current, name];
        this.lastUpdates = {
            ...this.lastUpdates,
            [name]: DateTime.now()
        };

        this.log(`Activate flag ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerActivated(name),
            this.#triggerChanged(name, true)
        ]);
    }

    async deactivate(name: string): Promise<void> {
        const current = this.currentFlags;

        if (!current.includes(name)) {
            return;
        }

        // Clear any existing timeout for this flag
        this.#clearFlagTimeout(name);

        this.currentFlags = current.filter(f => f !== name);
        this.lastUpdates = {
            ...this.lastUpdates,
            [name]: DateTime.now()
        };

        this.log(`Deactivate flag ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerDeactivated(name),
            this.#triggerChanged(name, false)
        ]);
    }

    async toggle(name: string): Promise<void> {
        if (this.currentFlags.includes(name)) {
            await this.deactivate(name);
        } else {
            await this.activate(name);
        }
    }

    async activateFor(name: string, duration: number, unit: ClockUnit): Promise<void> {
        // Clear any existing timeout for this flag
        this.#clearFlagTimeout(name);

        // Activate the flag
        await this.activate(name);

        // Schedule deactivation
        this.#scheduleDeactivation(name, duration, unit);

        this.log(`Activated flag ${name} for ${duration} ${unit}.`);
    }

    async isActiveFor(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.lastUpdates[name];
        
        if (!lastUpdate) {
            return false;
        }

        const isActive = this.currentFlags.includes(name);
        if (!isActive) {
            return false;
        }

        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return lastUpdate <= cutoff;
    }

    async isInactiveFor(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.lastUpdates[name];

        if (!lastUpdate) {
            // If there's no lastUpdate, the flag has never been touched, so consider it inactive forever
            return true;
        }

        const isActive = this.currentFlags.includes(name);
        if (isActive) {
            return false;
        }

        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return lastUpdate <= cutoff;
    }

    async getLook(name: string): Promise<Look> {
        return this.looks[name] ?? ['#204ef6', ''];
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
