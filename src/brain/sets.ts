import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { MAX_TIMEOUT_MS, REALTIME_SETS_UPDATE, SETTING_SET_LOOKS, SETTING_SETS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { BitSet, BitSetState, ClockUnit, Feature, FlowBitsApp, Look, Styleable } from '../types';
import { convertDurationToMs } from '../util';

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
    #states: StoredSets = {};
    #looks: Record<string, Look> = {};

    async initialize(): Promise<void> {
        this.#states = this.settings.get(SETTING_SETS) ?? {};
        this.#looks = this.settings.get(SETTING_SET_LOOKS) ?? {};
        await this.#scheduleNextExpiration();
    }

    get looks(): Record<string, Look> {
        return this.#looks;
    }

    set looks(value: Record<string, Look>) {
        this.#looks = value;
        this.settings.set(SETTING_SET_LOOKS, value);
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused sets...');

        const definedSetNames = new Set(this.#buildDefinedMap().keys());

        for (const setName of Object.keys(this.#states)) {
            if (!definedSetNames.has(setName)) {
                this.log(`Deleting unused set ${setName}...`);
                delete this.#states[setName];
            }
        }

        for (const setName of Object.keys(this.#looks)) {
            if (!definedSetNames.has(setName)) {
                this.log(`Deleting unused set look ${setName}...`);
                delete this.#looks[setName];
            }
        }

        this.settings.set(SETTING_SETS, this.#states);
        this.settings.set(SETTING_SET_LOOKS, this.#looks);
    }

    async count(): Promise<number> {
        return this.#buildDefinedMap().size;
    }

    async find(name: string): Promise<BitSet | null> {
        const definedMap = this.#buildDefinedMap();
        const stateNames = definedMap.get(name);

        if (!stateNames) {
            return null;
        }

        const look = this.getLook(name);
        const bitStates: BitSetState[] = [...stateNames].map(stateName =>
            this.#mapStoredState(name, stateName)
        );
        const activeCount = bitStates.filter(s => s.active).length;

        return {
            name,
            color: look[0],
            icon: look[1],
            states: bitStates,
            anyActive: activeCount > 0,
            allActive: bitStates.length > 0 && activeCount === bitStates.length
        };
    }

    async findAll(): Promise<BitSet[]> {
        const definedMap = this.#buildDefinedMap();

        if (definedMap.size === 0) {
            return [];
        }

        return [...definedMap].map(([setName, stateNames]) => {
            const look = this.getLook(setName);
            const states: BitSetState[] = [...stateNames].map(stateName =>
                this.#mapStoredState(setName, stateName)
            );
            const activeCount = states.filter(s => s.active).length;

            return {
                name: setName,
                color: look[0],
                icon: look[1],
                states,
                anyActive: activeCount > 0,
                allActive: states.length > 0 && activeCount === states.length
            };
        });
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
        this.#ensureSet(setName);

        for (const state of set.states) {
            if (!state.active) {
                this.#states[setName][state.name] = [true, now, null];
            } else {
                this.#states[setName][state.name] = [true, this.#states[setName][state.name][1], null];
            }
        }

        this.settings.set(SETTING_SETS, this.#states);
        this.log(`Activated all states in set ${setName}.`);

        await this.#scheduleNextExpiration();
        await this.#emitActivations(setName, inactiveStates.map(s => s.name), snapshot);
    }

    async activateState(setName: string, stateName: string): Promise<void> {
        const snapshot = this.#snapshot(setName);
        this.#ensureSet(setName);

        this.#states[setName][stateName] = [true, DateTime.now().toISO(), null];
        this.settings.set(SETTING_SETS, this.#states);

        this.log(`Activated state ${stateName} in set ${setName}.`);

        await this.#scheduleNextExpiration();
        await this.#emitActivations(setName, [stateName], snapshot);
    }

    async activateStateExclusive(setName: string, stateName: string): Promise<void> {
        await this.#activateStateExclusiveInternal(setName, stateName);
    }

    async activateStateExclusiveFor(setName: string, stateName: string, duration: number, unit: ClockUnit): Promise<void> {
        const expiresAt = DateTime.now().plus({milliseconds: convertDurationToMs(duration, unit)});

        await this.#activateStateExclusiveInternal(setName, stateName, expiresAt.toISO());

        this.log(`Activated state ${stateName} exclusively in set ${setName} for ${duration} ${unit}.`);
    }

    async activateStateFor(setName: string, stateName: string, duration: number, unit: ClockUnit): Promise<void> {
        const snapshot = this.#snapshot(setName);
        const wasTargetActive = await this.isStateActive(setName, stateName);

        const now = DateTime.now();
        const expiresAt = now.plus({milliseconds: convertDurationToMs(duration, unit)});

        this.#ensureSet(setName);
        this.#states[setName][stateName] = [true, now.toISO(), expiresAt.toISO()];
        this.settings.set(SETTING_SETS, this.#states);

        this.log(`Activated state ${stateName} in set ${setName} for ${duration} ${unit}.`);

        await this.#scheduleNextExpiration();
        await this.#emitActivations(setName, wasTargetActive ? [] : [stateName], snapshot);
    }

    async deactivateAll(setName: string): Promise<void> {
        const setStates = this.#states[setName];

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

        for (const stateName of statesToDeactivate) {
            this.#states[setName][stateName] = [false, now, null];
        }

        this.settings.set(SETTING_SETS, this.#states);
        this.log(`Deactivated all states in set ${setName}.`);

        await this.#scheduleNextExpiration();
        await this.#emitDeactivations(setName, statesToDeactivate, snapshot);
    }

    async deactivateState(setName: string, stateName: string): Promise<void> {
        if (!(await this.isStateActive(setName, stateName))) {
            return;
        }

        const snapshot = this.#snapshot(setName);

        this.#states[setName][stateName] = [false, DateTime.now().toISO(), null];
        this.settings.set(SETTING_SETS, this.#states);

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

    async isActiveAtLeast(setName: string, count: number): Promise<boolean> {
        const {activeCount} = this.#getCounts(setName);

        return activeCount >= count;
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
        return this.#states[setName]?.[stateName]?.[0] ?? false;
    }

    getLook(name: string): Look {
        return this.#looks[name] ?? ['#204ef6', ''];
    }

    async setLook(name: string, look: Look): Promise<void> {
        this.#looks[name] = look;
        this.settings.set(SETTING_SET_LOOKS, this.#looks);

        await this.#triggerRealtime(name);
    }

    async update(): Promise<void> {
        await this.#syncDefinedStates();
        await this.#triggerRealtime();
    }

    async #activateStateExclusiveInternal(setName: string, stateName: string, expiresAtISO?: string | null): Promise<void> {
        const definedStates = this.#buildDefinedMap().get(setName) ?? new Set<string>();
        const snapshot = this.#snapshot(setName, definedStates);
        const now = DateTime.now().toISO();
        const previousStates = this.#states[setName] ?? {};

        const statesToDeactivate = Object.entries(previousStates)
            .filter(([name, [active]]) => active && name !== stateName)
            .map(([name]) => name);

        const wasTargetActive = previousStates[stateName]?.[0] ?? false;

        this.#states[setName] = {};
        for (const name of definedStates) {
            if (name === stateName) {
                this.#states[setName][name] = [true, now, expiresAtISO ?? null];
            } else {
                this.#states[setName][name] = [false, now, null];
            }
        }

        if (!definedStates.has(stateName)) {
            this.#states[setName][stateName] = [true, now, expiresAtISO ?? null];
        }

        this.settings.set(SETTING_SETS, this.#states);
        this.log(`Activated state ${stateName} exclusively in set ${setName}.`);

        await this.#scheduleNextExpiration();

        const triggers: Promise<void>[] = [this.#triggerRealtime(setName)];

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

        const counts = this.#getCounts(setName, definedStates);
        const isNowAllActive = counts.totalCount > 0 && counts.activeCount === counts.totalCount;

        if (!snapshot.allActive && isNowAllActive) {
            triggers.push(this.#triggerSetBecomesActiveAll(setName));
        }

        if (snapshot.allActive && !isNowAllActive) {
            triggers.push(this.#triggerSetBecomesInactiveAll(setName));
        }

        const activeStates = this.#getActiveStateNames(setName, definedStates);

        if (!wasTargetActive) {
            triggers.push(this.#triggerSetBecomesActiveAtLeast(setName, counts.activeCount));
        }

        triggers.push(this.#triggerSetChanged(setName, true, counts.activeCount, counts.totalCount, activeStates));

        await Promise.allSettled(triggers);
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

    async #triggerSetBecomesActiveAtLeast(set: string, activeCount: number): Promise<void> {
        this.registry
            .findTrigger(Triggers.SetBecomesActiveAtLeast)
            ?.trigger({set, activeCount});
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

    async #triggerRealtime(setName?: string): Promise<void> {
        if (setName) {
            const definedStates = this.#buildDefinedMap().get(setName);

            if (!definedStates) {
                return;
            }

            const look = this.getLook(setName);
            const states: BitSetState[] = [...definedStates].map(stateName =>
                this.#mapStoredState(setName, stateName)
            );
            const activeCount = states.filter(s => s.active).length;

            this.realtime(REALTIME_SETS_UPDATE, {
                name: setName,
                color: look[0],
                icon: look[1],
                states,
                anyActive: activeCount > 0,
                allActive: states.length > 0 && activeCount === states.length
            } satisfies BitSet);
        } else {
            const sets = await this.findAll();

            for (const set of sets) {
                this.realtime(REALTIME_SETS_UPDATE, set);
            }
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

    #snapshot(setName: string, definedStates?: Set<string>): Snapshot {
        const {activeCount, totalCount} = this.#getCounts(setName, definedStates);

        return {
            anyActive: activeCount > 0,
            allActive: totalCount > 0 && activeCount === totalCount
        };
    }

    #ensureSet(setName: string): void {
        if (!this.#states[setName]) {
            this.#states[setName] = {};
        }
    }

    #mapStoredState(setName: string, stateName: string): BitSetState {
        const stored = this.#states[setName]?.[stateName];

        return stored
            ? {name: stateName, active: stored[0], lastUpdate: stored[1] ?? undefined, expiresAt: stored[2] ?? undefined}
            : {name: stateName, active: false, lastUpdate: undefined, expiresAt: undefined};
    }

    #getActiveStateNames(setName: string, definedStates?: Set<string>): string {
        const states = definedStates ?? this.#buildDefinedMap().get(setName);

        if (!states || states.size === 0) {
            return '';
        }

        return [...states]
            .filter(stateName => this.#mapStoredState(setName, stateName).active)
            .join(', ');
    }

    #getCounts(setName: string, definedStates?: Set<string>): SetCounts {
        const states = definedStates ?? this.#buildDefinedMap().get(setName);

        if (!states || states.size === 0) {
            return {activeCount: 0, totalCount: 0};
        }

        const activeCount = [...states]
            .filter(stateName => this.#mapStoredState(setName, stateName).active).length;

        return {activeCount, totalCount: states.size};
    }

    async #emitActivations(setName: string, activatedStates: string[], snapshot: Snapshot): Promise<void> {
        const definedStates = this.#buildDefinedMap().get(setName) ?? new Set<string>();
        const counts = this.#getCounts(setName, definedStates);
        const activeStates = this.#getActiveStateNames(setName, definedStates);
        const isNowAllActive = counts.totalCount > 0 && counts.activeCount === counts.totalCount;
        const triggers: Promise<void>[] = [this.#triggerRealtime(setName)];

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
        if (activatedStates.length > 0) {
            triggers.push(this.#triggerSetBecomesActiveAtLeast(setName, counts.activeCount));
        }

        triggers.push(this.#triggerSetChanged(setName, true, counts.activeCount, counts.totalCount, activeStates));

        await Promise.allSettled(triggers);
    }

    async #emitDeactivations(setName: string, deactivatedStates: string[], snapshot: Snapshot): Promise<void> {
        const definedStates = this.#buildDefinedMap().get(setName) ?? new Set<string>();
        const counts = this.#getCounts(setName, definedStates);
        const activeStates = this.#getActiveStateNames(setName, definedStates);
        const isNowAnyActive = counts.activeCount > 0;
        const triggers: Promise<void>[] = [this.#triggerRealtime(setName)];

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
        let changed = false;

        for (const [setName, stateNames] of definedMap) {
            if (!this.#states[setName]) {
                this.#states[setName] = {};
                changed = true;
            }

            for (const stateName of stateNames) {
                if (!(stateName in this.#states[setName])) {
                    this.#states[setName][stateName] = [false, null, null];
                    changed = true;
                    this.log(`Registered new state ${stateName} in set ${setName}.`);
                }
            }
        }

        for (const [setName, setStates] of Object.entries(this.#states)) {
            const definedInSet = definedMap.get(setName);

            for (const stateName of Object.keys(setStates)) {
                if (!definedInSet?.has(stateName)) {
                    delete this.#states[setName][stateName];
                    changed = true;
                    this.log(`Removed undefined state ${stateName} from set ${setName}.`);
                }
            }

            if (Object.keys(this.#states[setName]).length === 0) {
                delete this.#states[setName];
                changed = true;
                this.log(`Removed empty set ${setName}.`);
            }
        }

        if (changed) {
            this.settings.set(SETTING_SETS, this.#states);
            await this.#scheduleNextExpiration();
        }
    }

    async #scheduleNextExpiration(): Promise<void> {
        if (this.#expirationTimeout) {
            this.clearTimeout(this.#expirationTimeout);
            this.#expirationTimeout = null;
        }

        const nowMs = Date.now();
        let earliestMs: number | null = null;

        for (const setStates of Object.values(this.#states)) {
            for (const [active, , expiresAtStr] of Object.values(setStates)) {
                if (!active || !expiresAtStr) {
                    continue;
                }

                const expiresAtMs = Date.parse(expiresAtStr);

                if (earliestMs === null || expiresAtMs < earliestMs) {
                    earliestMs = expiresAtMs;
                }
            }
        }

        if (earliestMs === null) {
            return;
        }

        const diff = earliestMs - nowMs;

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
        const nowMs = Date.now();
        const expiredStates: { setName: string; stateName: string }[] = [];

        for (const [setName, setStates] of Object.entries(this.#states)) {
            for (const [stateName, [active, , expiresAtStr]] of Object.entries(setStates)) {
                if (!active || !expiresAtStr) {
                    continue;
                }

                if (Date.parse(expiresAtStr) <= nowMs) {
                    expiredStates.push({setName, stateName});
                }
            }
        }

        await Promise.allSettled(expiredStates.map(({setName, stateName}) =>
            this.deactivateState(setName, stateName)
        ));

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
