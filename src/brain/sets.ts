import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { MAX_TIMEOUT_MS, REALTIME_SETS_UPDATE, SETTING_SET_LOOKS, SETTING_SETS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { BitSet, BitSetState, ClockUnit, Feature, FlowBitsApp, Look, Styleable } from '../types';
import { convertDurationToSeconds } from '../util';

type SetCounts = {
    readonly activeCount: number;
    readonly totalCount: number;
};

type Snapshot = {
    readonly anyActive: boolean;
    readonly allActive: boolean;
};

type StoredSet = Record<string, [active: boolean, lastUpdate: string | null, expiresAt: string | null]>;
type StoredSets = Record<string, StoredSet>;

export default class Sets extends Shortcuts<FlowBitsApp> implements Feature<BitSet>, Styleable {
    #expirationTimeout: NodeJS.Timeout | null = null;

    get looks(): Record<string, Look> {
        return this.settings.get(SETTING_SET_LOOKS) ?? {};
    }

    set looks(value: Record<string, Look>) {
        this.settings.set(SETTING_SET_LOOKS, value);
    }

    get states(): StoredSets {
        return this.settings.get(SETTING_SETS) ?? {};
    }

    set states(value: StoredSets) {
        this.settings.set(SETTING_SETS, value);
    }

    async initialize(): Promise<void> {
        await this.#scheduleNextExpiration();
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused sets...');

        const definedSetNames = new Set(this.#buildDefinedMap().keys());
        const states = this.states;
        const looks = this.looks;

        for (const setName of Object.keys(states)) {
            if (!definedSetNames.has(setName)) {
                this.log(`Deleting unused set ${setName}...`);
                delete states[setName];
            }
        }

        for (const setName of Object.keys(looks)) {
            if (!definedSetNames.has(setName)) {
                this.log(`Deleting unused set look ${setName}...`);
                delete looks[setName];
            }
        }

        this.states = states;
        this.looks = looks;
    }

    async count(): Promise<number> {
        const sets = await this.findAll();

        return sets.length;
    }

    async find(name: string): Promise<BitSet | null> {
        const sets = await this.findAll();
        const set = sets.find(set => set.name === name);

        return set ?? null;
    }

    async findAll(): Promise<BitSet[]> {
        const definedMap = this.#buildDefinedMap();

        if (definedMap.size === 0) {
            return [];
        }

        const results: BitSet[] = [];

        for (const [setName, stateNames] of definedMap) {
            const look = await this.getLook(setName);

            const states: BitSetState[] = [...stateNames].map(stateName =>
                this.#mapStoredState(setName, stateName)
            );

            const activeCount = states.filter(s => s.active).length;

            results.push({
                name: setName,
                color: look[0],
                icon: look[1],
                states,
                anyActive: activeCount > 0,
                allActive: states.length > 0 && activeCount === states.length
            });
        }

        return results;
    }

    async activateAll(setName: string): Promise<void> {
        const set = await this.find(setName);

        if (!set || set.states.length === 0) {
            return;
        }

        const snapshot = this.#snapshot(setName);
        const inactiveStates = set.states.filter(s => !s.active);

        if (inactiveStates.length === 0) {
            return;
        }

        const now = DateTime.now().toISO();
        const states = this.#ensureSet(setName);

        for (const state of set.states) {
            if (!state.active) {
                states[setName][state.name] = [true, now, null];
            } else {
                states[setName][state.name] = [true, states[setName][state.name][1], null];
            }
        }

        this.states = states;
        this.log(`Activated all states in set ${setName}.`);

        await this.#scheduleNextExpiration();
        await this.#emitActivations(setName, inactiveStates.map(s => s.name), snapshot);
    }

    async activateState(setName: string, stateName: string): Promise<void> {
        const snapshot = this.#snapshot(setName);
        const states = this.#ensureSet(setName);

        states[setName][stateName] = [true, DateTime.now().toISO(), null];
        this.states = states;

        this.log(`Activated state ${stateName} in set ${setName}.`);

        await this.#scheduleNextExpiration();
        await this.#emitActivations(setName, [stateName], snapshot);
    }

    async activateStateExclusive(setName: string, stateName: string): Promise<void> {
        const snapshot = this.#snapshot(setName);
        const now = DateTime.now().toISO();
        const states = this.states;
        const previousStates = states[setName] ?? {};

        const statesToDeactivate = Object.entries(previousStates)
            .filter(([name, [active]]) => active && name !== stateName)
            .map(([name]) => name);

        const wasTargetActive = previousStates[stateName]?.[0] ?? false;

        states[setName] = Object.fromEntries(
            Object.keys(previousStates).map(name => [
                name,
                [name === stateName, now, null] as [boolean, string, null]
            ])
        );

        if (!previousStates[stateName]) {
            states[setName][stateName] = [true, now, null];
        }

        this.states = states;
        this.log(`Activated state ${stateName} exclusively in set ${setName}.`);

        await this.#scheduleNextExpiration();

        const triggers: Promise<void>[] = [this.#triggerRealtime()];

        for (const state of statesToDeactivate) {
            triggers.push(this.#triggerStateDeactivated(setName, state));
            triggers.push(this.#triggerStateChanged(setName, state, false));
        }

        if (!wasTargetActive) {
            triggers.push(this.#triggerStateActivated(setName, stateName));
            triggers.push(this.#triggerStateChanged(setName, stateName, true));
        }

        if (!snapshot.anyActive) {
            triggers.push(this.#triggerSetBecomesActiveAny(setName));
        }

        const isNowAllActive = await this.isActiveAll(setName);

        if (!snapshot.allActive && isNowAllActive) {
            triggers.push(this.#triggerSetBecomesActiveAll(setName));
        }

        if (snapshot.allActive && !isNowAllActive) {
            triggers.push(this.#triggerSetBecomesInactiveAll(setName));
        }

        const activeStates = this.#getActiveStateNames(setName);
        const counts = this.#getCounts(setName);
        triggers.push(this.#triggerSetChanged(setName, true, counts.activeCount, counts.totalCount, activeStates));

        await Promise.allSettled(triggers);
    }

    async activateStateExclusiveFor(setName: string, stateName: string, duration: number, unit: ClockUnit): Promise<void> {
        const snapshot = this.#snapshot(setName);
        const now = DateTime.now();
        const expiresAt = now.plus({seconds: convertDurationToSeconds(duration, unit)});
        const nowISO = now.toISO();
        const states = this.states;
        const previousStates = states[setName] ?? {};
        const definedStates = this.#buildDefinedMap().get(setName) ?? new Set<string>();

        const statesToDeactivate = Object.entries(previousStates)
            .filter(([name, [active]]) => active && name !== stateName)
            .map(([name]) => name);

        const wasTargetActive = previousStates[stateName]?.[0] ?? false;

        states[setName] = {};
        for (const name of definedStates) {
            if (name === stateName) {
                states[setName][name] = [true, nowISO, expiresAt.toISO()];
            } else {
                states[setName][name] = [false, nowISO, null];
            }
        }

        if (!definedStates.has(stateName)) {
            states[setName][stateName] = [true, nowISO, expiresAt.toISO()];
        }

        this.states = states;
        this.log(`Activated state ${stateName} exclusively in set ${setName} for ${duration} ${unit}.`);

        await this.#scheduleNextExpiration();

        const triggers: Promise<void>[] = [this.#triggerRealtime()];

        for (const state of statesToDeactivate) {
            triggers.push(this.#triggerStateDeactivated(setName, state));
            triggers.push(this.#triggerStateChanged(setName, state, false));
        }

        if (!wasTargetActive) {
            triggers.push(this.#triggerStateActivated(setName, stateName));
            triggers.push(this.#triggerStateChanged(setName, stateName, true));
        }

        if (!snapshot.anyActive) {
            triggers.push(this.#triggerSetBecomesActiveAny(setName));
        }

        const isNowAllActive = await this.isActiveAll(setName);

        if (!snapshot.allActive && isNowAllActive) {
            triggers.push(this.#triggerSetBecomesActiveAll(setName));
        }

        if (snapshot.allActive && !isNowAllActive) {
            triggers.push(this.#triggerSetBecomesInactiveAll(setName));
        }

        const activeStates = this.#getActiveStateNames(setName);
        const counts = this.#getCounts(setName);
        triggers.push(this.#triggerSetChanged(setName, true, counts.activeCount, counts.totalCount, activeStates));

        await Promise.allSettled(triggers);
    }

    async activateStateFor(setName: string, stateName: string, duration: number, unit: ClockUnit): Promise<void> {
        const snapshot = this.#snapshot(setName);
        const wasTargetActive = await this.isStateActive(setName, stateName);

        const now = DateTime.now();
        const expiresAt = now.plus({seconds: convertDurationToSeconds(duration, unit)});

        const states = this.#ensureSet(setName);
        states[setName][stateName] = [true, now.toISO(), expiresAt.toISO()];
        this.states = states;

        this.log(`Activated state ${stateName} in set ${setName} for ${duration} ${unit}.`);

        await this.#scheduleNextExpiration();
        await this.#emitActivations(setName, wasTargetActive ? [] : [stateName], snapshot);
    }

    async deactivateAll(setName: string): Promise<void> {
        const setStates = this.states[setName];

        if (!setStates) {
            return;
        }

        const snapshot = this.#snapshot(setName);
        const statesToDeactivate = Object.entries(setStates)
            .filter(([, [active]]) => active)
            .map(([name]) => name);

        if (statesToDeactivate.length === 0) {
            return;
        }

        const now = DateTime.now().toISO();
        const states = this.states;

        for (const stateName of statesToDeactivate) {
            states[setName][stateName] = [false, now, null];
        }

        this.states = states;
        this.log(`Deactivated all states in set ${setName}.`);

        await this.#scheduleNextExpiration();
        await this.#emitDeactivations(setName, statesToDeactivate, snapshot);
    }

    async deactivateState(setName: string, stateName: string): Promise<void> {
        if (!(await this.isStateActive(setName, stateName))) {
            return;
        }

        const snapshot = this.#snapshot(setName);
        const states = this.states;

        states[setName][stateName] = [false, DateTime.now().toISO(), null];
        this.states = states;

        this.log(`Deactivated state ${stateName} in set ${setName}.`);

        await this.#scheduleNextExpiration();
        await this.#emitDeactivations(setName, [stateName], snapshot);
    }

    async toggleState(setName: string, stateName: string): Promise<void> {
        if (await this.isStateActive(setName, stateName)) {
            await this.deactivateState(setName, stateName);
        } else {
            await this.activateState(setName, stateName);
        }
    }

    async toggleStateFor(setName: string, stateName: string, duration: number, unit: ClockUnit): Promise<void> {
        if (await this.isStateActive(setName, stateName)) {
            await this.deactivateState(setName, stateName);
        } else {
            await this.activateStateFor(setName, stateName, duration, unit);
        }
    }

    async isActiveAll(setName: string): Promise<boolean> {
        const {activeCount, totalCount} = this.#getCounts(setName);

        return totalCount > 0 && activeCount === totalCount;
    }

    async isActiveAny(setName: string): Promise<boolean> {
        const {activeCount} = this.#getCounts(setName);

        return activeCount > 0;
    }

    async isInactive(setName: string): Promise<boolean> {
        const {activeCount, totalCount} = this.#getCounts(setName);

        return totalCount === 0 || activeCount === 0;
    }

    async isStateActive(setName: string, stateName: string): Promise<boolean> {
        return this.states[setName]?.[stateName]?.[0] ?? false;
    }

    async getLook(name: string): Promise<Look> {
        return this.looks[name] ?? ['#204ef6', ''];
    }

    async setLook(name: string, look: Look): Promise<void> {
        this.looks = {
            ...this.looks,
            [name]: look
        };

        await this.#triggerRealtime();
    }

    async update(): Promise<void> {
        await this.#syncDefinedStates();
        await this.#triggerRealtime();
    }

    async #triggerSetBecomesActiveAll(set: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.SetBecomesActiveAll)
            ?.trigger({set});
    }

    async #triggerSetBecomesActiveAny(set: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.SetBecomesActiveAny)
            ?.trigger({set});
    }

    async #triggerSetBecomesInactive(set: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.SetBecomesInactive)
            ?.trigger({set});
    }

    async #triggerSetBecomesInactiveAll(set: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.SetBecomesInactiveAll)
            ?.trigger({set});
    }

    async #triggerSetChanged(set: string, active: boolean, activeCount: number, totalCount: number, activeStates: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.SetChanged)
            ?.trigger({set}, {active, activeCount, totalCount, activeStates});
    }

    async #triggerStateActivated(set: string, state: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.SetStateActivated)
            ?.trigger({set, state});
    }

    async #triggerStateChanged(set: string, state: string, active: boolean): Promise<void> {
        this.registry
            .findTrigger(Triggers.SetStateChanged)
            ?.trigger({set, state}, {active});
    }

    async #triggerStateDeactivated(set: string, state: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.SetStateDeactivated)
            ?.trigger({set, state});
    }

    async #triggerRealtime(): Promise<void> {
        const sets = await this.findAll();

        for (const set of sets) {
            this.realtime(REALTIME_SETS_UPDATE, set);
        }
    }

    #buildDefinedMap(): Map<string, Set<string>> {
        const definedStates = this.#autocompleteProvider().values;
        const map = new Map<string, Set<string>>();

        for (const {set: setName, state: stateName} of definedStates) {
            if (!map.has(setName)) {
                map.set(setName, new Set());
            }
            map.get(setName)!.add(stateName);
        }

        return map;
    }

    #snapshot(setName: string): Snapshot {
        const {activeCount, totalCount} = this.#getCounts(setName);

        return {
            anyActive: activeCount > 0,
            allActive: totalCount > 0 && activeCount === totalCount
        };
    }

    #ensureSet(setName: string): StoredSets {
        const states = this.states;

        if (!states[setName]) {
            states[setName] = {};
        }

        return states;
    }

    #mapStoredState(setName: string, stateName: string): BitSetState {
        const stored = this.states[setName]?.[stateName];

        return stored
            ? {name: stateName, active: stored[0], lastUpdate: stored[1] ?? undefined, expiresAt: stored[2] ?? undefined}
            : {name: stateName, active: false, lastUpdate: undefined, expiresAt: undefined};
    }

    #getActiveStateNames(setName: string): string {
        const definedStates = this.#buildDefinedMap().get(setName);

        if (!definedStates || definedStates.size === 0) {
            return '';
        }

        return [...definedStates]
            .filter(stateName => this.#mapStoredState(setName, stateName).active)
            .join(', ');
    }

    #getCounts(setName: string): SetCounts {
        const definedStates = this.#buildDefinedMap().get(setName);

        if (!definedStates || definedStates.size === 0) {
            return {activeCount: 0, totalCount: 0};
        }

        const activeCount = [...definedStates]
            .filter(stateName => this.#mapStoredState(setName, stateName).active).length;

        return {activeCount, totalCount: definedStates.size};
    }

    async #emitActivations(setName: string, activatedStates: string[], snapshot: Snapshot): Promise<void> {
        const activeStates = this.#getActiveStateNames(setName);
        const counts = this.#getCounts(setName);
        const isNowAllActive = await this.isActiveAll(setName);
        const triggers: Promise<void>[] = [this.#triggerRealtime()];

        for (const state of activatedStates) {
            triggers.push(this.#triggerStateActivated(setName, state));
            triggers.push(this.#triggerStateChanged(setName, state, true));
        }

        if (!snapshot.anyActive && activatedStates.length > 0) {
            triggers.push(this.#triggerSetBecomesActiveAny(setName));
        }
        if (!snapshot.allActive && isNowAllActive) {
            triggers.push(this.#triggerSetBecomesActiveAll(setName));
        }

        triggers.push(this.#triggerSetChanged(setName, true, counts.activeCount, counts.totalCount, activeStates));

        await Promise.allSettled(triggers);
    }

    async #emitDeactivations(setName: string, deactivatedStates: string[], snapshot: Snapshot): Promise<void> {
        const activeStates = this.#getActiveStateNames(setName);
        const counts = this.#getCounts(setName);
        const isNowAnyActive = await this.isActiveAny(setName);
        const triggers: Promise<void>[] = [this.#triggerRealtime()];

        for (const state of deactivatedStates) {
            triggers.push(this.#triggerStateDeactivated(setName, state));
            triggers.push(this.#triggerStateChanged(setName, state, false));
        }

        if (snapshot.anyActive && !isNowAnyActive) {
            triggers.push(this.#triggerSetBecomesInactive(setName));
        }
        if (snapshot.allActive) {
            triggers.push(this.#triggerSetBecomesInactiveAll(setName));
        }

        triggers.push(this.#triggerSetChanged(setName, isNowAnyActive, counts.activeCount, counts.totalCount, activeStates));

        await Promise.allSettled(triggers);
    }

    async #syncDefinedStates(): Promise<void> {
        const definedMap = this.#buildDefinedMap();
        const states = this.states;
        let changed = false;

        for (const [setName, stateNames] of definedMap) {
            if (!states[setName]) {
                states[setName] = {};
                changed = true;
            }

            for (const stateName of stateNames) {
                if (!(stateName in states[setName])) {
                    states[setName][stateName] = [false, null, null];
                    changed = true;
                    this.log(`Registered new state ${stateName} in set ${setName}.`);
                }
            }
        }

        for (const [setName, setStates] of Object.entries(states)) {
            const definedInSet = definedMap.get(setName);

            for (const stateName of Object.keys(setStates)) {
                if (!definedInSet?.has(stateName)) {
                    delete states[setName][stateName];
                    changed = true;
                    this.log(`Removed undefined state ${stateName} from set ${setName}.`);
                }
            }

            if (Object.keys(states[setName]).length === 0) {
                delete states[setName];
                changed = true;
                this.log(`Removed empty set ${setName}.`);
            }
        }

        if (changed) {
            this.states = states;
            await this.#scheduleNextExpiration();
        }
    }

    async #scheduleNextExpiration(): Promise<void> {
        if (this.#expirationTimeout) {
            this.clearTimeout(this.#expirationTimeout);
            this.#expirationTimeout = null;
        }

        const now = DateTime.now();
        let earliestExpiration: { setName: string; stateName: string; expiresAt: DateTime } | null = null;

        for (const [setName, setStates] of Object.entries(this.states)) {
            for (const [stateName, [active, , expiresAtStr]] of Object.entries(setStates)) {
                if (!active || !expiresAtStr) {
                    continue;
                }

                const expiresAt = DateTime.fromISO(expiresAtStr);

                if (!earliestExpiration || expiresAt < earliestExpiration.expiresAt) {
                    earliestExpiration = {setName, stateName, expiresAt};
                }
            }
        }

        if (!earliestExpiration) {
            return;
        }

        const diff = earliestExpiration.expiresAt.diff(now).as('milliseconds');

        if (diff <= 0) {
            await this.#processExpirations();
            return;
        }

        const delay = Math.min(diff, MAX_TIMEOUT_MS);

        this.#expirationTimeout = this.setTimeout(async () => {
            this.#expirationTimeout = null;
            await this.#processExpirations();
        }, delay);

        this.log(`Scheduled next expiration check in ${Math.round(delay / 1000)}s`);
    }

    async #processExpirations(): Promise<void> {
        const now = DateTime.now();
        const expiredStates: { setName: string; stateName: string }[] = [];

        for (const [setName, setStates] of Object.entries(this.states)) {
            for (const [stateName, [active, , expiresAtStr]] of Object.entries(setStates)) {
                if (!active || !expiresAtStr) {
                    continue;
                }

                const expiresAt = DateTime.fromISO(expiresAtStr);

                if (expiresAt <= now) {
                    expiredStates.push({setName, stateName});
                }
            }
        }

        for (const {setName, stateName} of expiredStates) {
            await this.deactivateState(setName, stateName);
        }

        if (expiredStates.length === 0) {
            await this.#scheduleNextExpiration();
        }
    }

    #autocompleteProvider(): AutocompleteProviders.SetState {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.SetState);

        if (!provider) {
            throw new Error('Failed to get the set state autocomplete provider.');
        }

        return provider;
    }
}
