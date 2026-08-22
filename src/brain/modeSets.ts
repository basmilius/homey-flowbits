import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { MAX_TIMEOUT_MS, REALTIME_MODE_SET_UPDATE, SETTING_MODE_SET_CURRENT, SETTING_MODE_SET_LAST_UPDATES, SETTING_MODE_SET_LOOKS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { ClockUnit, Feature, FlowBitsApp, Look, ModeSet, ModeSetMode } from '../types';
import { convertDurationToMs } from '../util';

type StoredCurrent = Record<string, string | null>;
type StoredLooks = Record<string, Record<string, Look>>;
type StoredLastUpdates = Record<string, Record<string, string>>;

export default class ModeSets extends Shortcuts<FlowBitsApp> implements Feature<ModeSet> {
    #deactivationTimeouts: Map<string, NodeJS.Timeout> = new Map();

    get current(): StoredCurrent {
        return this.settings.get(SETTING_MODE_SET_CURRENT) ?? {};
    }

    set current(value: StoredCurrent) {
        this.settings.set(SETTING_MODE_SET_CURRENT, value);
    }

    get looks(): StoredLooks {
        return this.settings.get(SETTING_MODE_SET_LOOKS) ?? {};
    }

    set looks(value: StoredLooks) {
        this.settings.set(SETTING_MODE_SET_LOOKS, value);
    }

    get lastUpdates(): Record<string, Record<string, DateTime>> {
        const stored: StoredLastUpdates = this.settings.get(SETTING_MODE_SET_LAST_UPDATES) ?? {};

        return Object.fromEntries(
            Object.entries(stored).map(([setName, modes]) => [
                setName,
                Object.fromEntries(
                    Object.entries(modes).map(([modeName, value]) => [
                        modeName,
                        DateTime.fromISO(value)
                    ])
                )
            ])
        );
    }

    set lastUpdates(value: Record<string, Record<string, DateTime>>) {
        this.settings.set(SETTING_MODE_SET_LAST_UPDATES, Object.fromEntries(
            Object.entries(value).map(([setName, modes]) => [
                setName,
                Object.fromEntries(
                    Object.entries(modes).map(([modeName, value]) => [
                        modeName,
                        value.toISO()
                    ])
                )
            ])
        ));
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused mode sets...');

        const definedMap = this.#buildDefinedMap();
        const current = this.current;
        const looks = this.looks;
        const lastUpdates: StoredLastUpdates = this.settings.get(SETTING_MODE_SET_LAST_UPDATES) ?? {};

        for (const setName of Object.keys(current)) {
            const definedModes = definedMap.get(setName);
            const currentMode = current[setName];

            if (!definedModes || (currentMode !== null && !definedModes.has(currentMode))) {
                this.log(`Clearing current mode for unused mode set ${setName}...`);
                delete current[setName];
            }
        }

        for (const setName of Object.keys(looks)) {
            const definedModes = definedMap.get(setName);

            if (!definedModes) {
                this.log(`Deleting unused mode set look group ${setName}...`);
                delete looks[setName];
                continue;
            }

            for (const modeName of Object.keys(looks[setName])) {
                if (!definedModes.has(modeName)) {
                    this.log(`Deleting unused mode set look ${setName}:${modeName}...`);
                    delete looks[setName][modeName];
                }
            }
        }

        for (const setName of Object.keys(lastUpdates)) {
            const definedModes = definedMap.get(setName);

            if (!definedModes) {
                delete lastUpdates[setName];
                continue;
            }

            for (const modeName of Object.keys(lastUpdates[setName])) {
                if (!definedModes.has(modeName)) {
                    delete lastUpdates[setName][modeName];
                }
            }
        }

        this.current = current;
        this.looks = looks;
        this.settings.set(SETTING_MODE_SET_LAST_UPDATES, lastUpdates);
    }

    async count(): Promise<number> {
        const sets = await this.findAll();

        return sets.length;
    }

    async find(name: string): Promise<ModeSet | null> {
        const sets = await this.findAll();
        const set = sets.find(set => set.name === name);

        return set ?? null;
    }

    async findAll(): Promise<ModeSet[]> {
        const definedMap = this.#buildDefinedMap();

        if (definedMap.size === 0) {
            return [];
        }

        const current = this.current;

        return [...definedMap].map(([setName, modeNames]) => {
            const currentMode = current[setName] ?? null;
            const modes: ModeSetMode[] = [...modeNames]
                .map(modeName => this.#mapMode(setName, modeName, currentMode));

            return {
                currentMode,
                modes,
                name: setName
            };
        });
    }

    async activate(setName: string, modeName: string): Promise<void> {
        const current = this.#currentFor(setName);

        if (!setName || !modeName || current === modeName) {
            return;
        }

        this.#clearModeSetTimeout(setName);
        this.#setCurrent(setName, modeName);

        if (current !== null) {
            await this.#triggerDeactivated(setName, current);
        }

        this.#touch(setName, modeName, current);

        this.log(`Activate mode ${modeName} in mode set ${setName}.`);

        const triggers: Promise<void>[] = [
            this.#triggerRealtime(setName),
            this.#triggerActivated(setName, modeName),
            this.#triggerModeChanged(setName, modeName, true),
            this.#triggerCurrentChanged(setName, modeName)
        ];

        if (current !== null) {
            triggers.push(this.#triggerModeChanged(setName, current, false));
        }

        await Promise.allSettled(triggers);
    }

    async deactivate(setName: string, modeName: string): Promise<void> {
        const current = this.#currentFor(setName);

        if (!modeName || current !== modeName) {
            return;
        }

        this.#clearModeSetTimeout(setName);
        this.#setCurrent(setName, null);
        this.#touch(setName, modeName);

        this.log(`Deactivate mode ${modeName} in mode set ${setName}.`);

        await Promise.allSettled([
            this.#triggerRealtime(setName),
            this.#triggerDeactivated(setName, modeName),
            this.#triggerModeChanged(setName, modeName, false),
            this.#triggerCurrentChanged(setName, null)
        ]);
    }

    async reactivate(setName: string, modeName: string): Promise<void> {
        if (!setName || !modeName) {
            return;
        }

        this.#clearModeSetTimeout(setName);
        this.#setCurrent(setName, modeName);
        this.#touch(setName, modeName);

        this.log(`Reactivate mode ${modeName} in mode set ${setName}.`);

        await Promise.allSettled([
            this.#triggerRealtime(setName),
            this.#triggerActivated(setName, modeName),
            this.#triggerModeChanged(setName, modeName, true),
            this.#triggerCurrentChanged(setName, modeName)
        ]);
    }

    async reactivateCurrent(setName: string): Promise<void> {
        const current = this.#currentFor(setName);

        if (current === null) {
            this.log(`No current mode to reactivate in mode set ${setName}.`);
            return;
        }

        await this.reactivate(setName, current);
    }

    async toggle(setName: string, modeName: string): Promise<void> {
        if (this.#currentFor(setName) === modeName) {
            await this.deactivate(setName, modeName);
        } else {
            await this.activate(setName, modeName);
        }
    }

    async activateFor(setName: string, modeName: string, duration: number, unit: ClockUnit): Promise<void> {
        if (!setName || !modeName) {
            return;
        }

        this.#clearModeSetTimeout(setName);
        await this.activate(setName, modeName);
        this.#scheduleDeactivation(setName, modeName, duration, unit);

        this.log(`Activated mode ${modeName} in mode set ${setName} for ${duration} ${unit}.`);
    }

    async isActive(setName: string): Promise<boolean> {
        return this.#currentFor(setName) !== null;
    }

    async isModeActive(setName: string, modeName: string): Promise<boolean> {
        return this.#currentFor(setName) === modeName;
    }

    async isActiveFor(setName: string, modeName: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.lastUpdates[setName]?.[modeName];

        if (!lastUpdate) {
            return false;
        }

        if (this.#currentFor(setName) !== modeName) {
            return false;
        }

        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return lastUpdate <= cutoff;
    }

    async isInactiveFor(setName: string, modeName: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.lastUpdates[setName]?.[modeName];

        if (!lastUpdate) {
            // If there's no lastUpdate, the mode has never been touched, so consider it inactive forever
            return true;
        }

        if (this.#currentFor(setName) === modeName) {
            return false;
        }

        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return lastUpdate <= cutoff;
    }

    getLook(setName: string, modeName: string): Look {
        return this.looks[setName]?.[modeName] ?? ['#204ef6', ''];
    }

    async setLook(setName: string, modeName: string, look: Look): Promise<void> {
        const looks = this.looks;

        if (!looks[setName]) {
            looks[setName] = {};
        }

        looks[setName][modeName] = look;
        this.looks = looks;

        await this.#triggerRealtime(setName);
    }

    async update(): Promise<void> {
        const sets = await this.findAll();

        for (const set of sets) {
            this.realtime(REALTIME_MODE_SET_UPDATE, set);
        }
    }

    #currentFor(setName: string): string | null {
        return this.current[setName] ?? null;
    }

    #setCurrent(setName: string, modeName: string | null): void {
        const current = this.current;
        current[setName] = modeName;
        this.current = current;
    }

    #touch(setName: string, modeName: string, previousModeName: string | null = null): void {
        const now = DateTime.now();
        const lastUpdates = this.lastUpdates;

        if (!lastUpdates[setName]) {
            lastUpdates[setName] = {};
        }

        lastUpdates[setName][modeName] = now;

        if (previousModeName !== null) {
            lastUpdates[setName][previousModeName] = now;
        }

        this.lastUpdates = lastUpdates;
    }

    #clearModeSetTimeout(setName: string): void {
        const timeout = this.#deactivationTimeouts.get(setName);

        if (!timeout) {
            return;
        }

        this.clearTimeout(timeout);
        this.#deactivationTimeouts.delete(setName);
    }

    #scheduleDeactivation(setName: string, modeName: string, duration: number, unit: ClockUnit): void {
        const ms = Math.min(convertDurationToMs(duration, unit), MAX_TIMEOUT_MS);

        const timeout = this.setTimeout(async () => {
            this.#deactivationTimeouts.delete(setName);
            await this.deactivate(setName, modeName);
        }, ms);

        this.#deactivationTimeouts.set(setName, timeout);
    }

    async #triggerActivated(setName: string, modeName: string): Promise<void> {
        await this.registry.fireTrigger(Triggers.ModeSetActivated, {set: setName, mode: modeName});
        await this.notify(this.translate('notification.mode_set_activated', {name: modeName, set: setName}));
    }

    async #triggerModeChanged(setName: string, modeName: string, active: boolean): Promise<void> {
        await this.registry.fireTrigger(Triggers.ModeSetChanged, {set: setName, mode: modeName}, {active});
    }

    async #triggerCurrentChanged(setName: string, modeName: string | null): Promise<void> {
        await this.registry.fireTrigger(Triggers.ModeSetCurrentChanged, {set: setName}, {mode: modeName ?? '-'});
    }

    async #triggerDeactivated(setName: string, modeName: string): Promise<void> {
        await this.registry.fireTrigger(Triggers.ModeSetDeactivated, {set: setName, mode: modeName});
        await this.notify(this.translate('notification.mode_set_deactivated', {name: modeName, set: setName}));
    }

    async #triggerRealtime(setName: string): Promise<void> {
        const set = await this.find(setName);

        if (set) {
            this.realtime(REALTIME_MODE_SET_UPDATE, set);
        }
    }

    #mapMode(setName: string, modeName: string, currentMode: string | null): ModeSetMode {
        const look = this.getLook(setName, modeName);
        const lastUpdate = this.lastUpdates[setName]?.[modeName];

        return {
            active: currentMode === modeName,
            color: look[0],
            icon: look[1],
            lastUpdate: lastUpdate?.toISO() ?? undefined,
            name: modeName,
            set: setName
        };
    }

    #buildDefinedMap(): Map<string, Set<string>> {
        const definedModes = this.#autocompleteProvider().values;
        const map = new Map<string, Set<string>>();

        for (const {set: setName, mode: modeName} of definedModes) {
            if (!map.has(setName)) {
                map.set(setName, new Set());
            }

            map.get(setName)!.add(modeName);
        }

        return map;
    }

    #autocompleteProvider(): AutocompleteProviders.ModeSetMode {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.ModeSetMode);

        if (!provider) {
            throw new Error('Failed to get the mode set mode autocomplete provider.');
        }

        return provider;
    }
}
