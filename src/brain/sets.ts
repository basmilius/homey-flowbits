import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { REALTIME_SETS_UPDATE, SETTING_SET_LOOKS, SETTING_SETS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { ClockUnit, Feature, FlowBitsApp, Look, Set, SetState, Styleable } from '../types';
import { convertDurationToSeconds } from '../util';

type StoredSet = Record<string, [active: boolean, lastUpdate: string | null, expiresAt: string | null]>;
type StoredSets = Record<string, StoredSet>;

export default class Sets extends Shortcuts<FlowBitsApp> implements Feature<Set>, Styleable {
    #timeouts: Record<string, NodeJS.Timeout> = {};

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
        await this.#scheduleExpirations();
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused sets...');

        const definedSetNames = new Set((await this.findAll()).map(s => s.name));
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

    async find(name: string): Promise<Set | null> {
        const sets = await this.findAll();
        const set = sets.find(set => set.name === name);

        return set ?? null;
    }

    async findAll(): Promise<Set[]> {
        const definedSets = await this.#setAutocompleteProvider().find('');
        const definedStates = this.#setStateAutocompleteProvider().values;

        if (definedSets.length === 0) {
            return [];
        }

        const results: Set[] = [];

        for (const set of definedSets) {
            const look = await this.getLook(set.name);

            const states: SetState[] = definedStates
                .filter(state => state.set === set.name)
                .filter((value, index, arr) => arr.findIndex(v => v.state === value.state) === index)
                .map(state => this.#mapStoredState(set.name, state.state));

            const activeCount = states.filter(s => s.active).length;

            results.push({
                name: set.name,
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

        for (const state of inactiveStates) {
            states[setName][state.name] = [true, now, null];
        }

        this.states = states;
        this.log(`Activated all states in set ${setName}.`);

        await this.#emitActivations(setName, inactiveStates.map(s => s.name), snapshot, set.states.length, set.states.length);
    }

    async activateState(setName: string, stateName: string): Promise<void> {
        if (await this.isStateActive(setName, stateName)) {
            return;
        }

        const snapshot = this.#snapshot(setName);
        const states = this.#ensureSet(setName);

        states[setName][stateName] = [true, DateTime.now().toISO(), null];
        this.states = states;

        this.log(`Activated state ${stateName} in set ${setName}.`);

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

        for (const state of statesToDeactivate) {
            this.#clearTimeout(setName, state);
        }

        this.states = states;
        this.log(`Activated state ${stateName} exclusively in set ${setName}.`);

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

        if (snapshot.allActive && Object.keys(states[setName]).length > 1) {
            triggers.push(this.#triggerSetBecomesInactiveAll(setName));
        }

        triggers.push(this.#triggerSetChanged(setName, true, 1, Object.keys(states[setName]).length));

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

        await this.#scheduleExpiration(setName, stateName, expiresAt);
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
            this.#clearTimeout(setName, stateName);
        }

        this.states = states;
        this.log(`Deactivated all states in set ${setName}.`);

        await this.#emitDeactivations(setName, statesToDeactivate, snapshot, 0, Object.keys(states[setName]).length);
    }

    async deactivateState(setName: string, stateName: string): Promise<void> {
        if (!(await this.isStateActive(setName, stateName))) {
            return;
        }

        const snapshot = this.#snapshot(setName);
        const states = this.states;

        states[setName][stateName] = [false, DateTime.now().toISO(), null];
        this.#clearTimeout(setName, stateName);
        this.states = states;

        this.log(`Deactivated state ${stateName} in set ${setName}.`);

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
        const setStates = this.states[setName];

        if (!setStates) {
            return false;
        }

        const stateEntries = Object.values(setStates);

        return stateEntries.length > 0 && stateEntries.every(([active]) => active);
    }

    async isActiveAny(setName: string): Promise<boolean> {
        const setStates = this.states[setName];

        if (!setStates) {
            return false;
        }

        return Object.values(setStates).some(([active]) => active);
    }

    async isInactive(setName: string): Promise<boolean> {
        const setStates = this.states[setName];

        if (!setStates) {
            return true;
        }

        return Object.values(setStates).every(([active]) => !active);
    }

    async isStateActive(setName: string, stateName: string): Promise<boolean> {
        return this.states[setName]?.[stateName]?.[0] ?? false;
    }

    async getLook(name: string): Promise<Look> {
        return this.looks[name] ?? ['#204ef6', ''];
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

    async #triggerSetChanged(set: string, active: boolean, activeCount: number, totalCount: number): Promise<void> {
        this.registry
            .findTrigger(Triggers.SetChanged)
            ?.trigger({set}, {active, activeCount, totalCount});
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
        this.realtime(REALTIME_SETS_UPDATE);
    }

    #snapshot(setName: string): { anyActive: boolean; allActive: boolean } {
        const setStates = Object.values(this.states[setName] ?? {});
        const activeCount = setStates.filter(([active]) => active).length;

        return {
            anyActive: activeCount > 0,
            allActive: setStates.length > 0 && activeCount === setStates.length
        };
    }

    #ensureSet(setName: string): StoredSets {
        const states = this.states;
        if (!states[setName]) states[setName] = {};
        return states;
    }

    #mapStoredState(setName: string, stateName: string): SetState {
        const stored = this.states[setName]?.[stateName];

        return stored
            ? {name: stateName, active: stored[0], lastUpdate: stored[1] ?? undefined, expiresAt: stored[2] ?? undefined}
            : {name: stateName, active: false, lastUpdate: undefined, expiresAt: undefined};
    }

    #getCounts(setName: string): { activeCount: number; totalCount: number } {
        const setStates = this.states[setName] ?? {};
        return {
            activeCount: Object.values(setStates).filter(([active]) => active).length,
            totalCount: Object.keys(setStates).length
        };
    }

    async #emitActivations(setName: string, activatedStates: string[], snapshot: { anyActive: boolean; allActive: boolean }, activeCount?: number, totalCount?: number): Promise<void> {
        const counts = activeCount !== undefined && totalCount !== undefined
            ? {activeCount, totalCount}
            : this.#getCounts(setName);

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

        triggers.push(this.#triggerSetChanged(setName, true, counts.activeCount, counts.totalCount));

        await Promise.allSettled(triggers);
    }

    async #emitDeactivations(setName: string, deactivatedStates: string[], snapshot: { anyActive: boolean; allActive: boolean }, activeCount?: number, totalCount?: number): Promise<void> {
        const counts = activeCount !== undefined && totalCount !== undefined
            ? {activeCount, totalCount}
            : this.#getCounts(setName);

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

        triggers.push(this.#triggerSetChanged(setName, isNowAnyActive, counts.activeCount, counts.totalCount));

        await Promise.allSettled(triggers);
    }

    #timeoutKey(setName: string, stateName: string): string {
        return `${setName}:${stateName}`;
    }

    #clearTimeout(setName: string, stateName: string): void {
        const key = this.#timeoutKey(setName, stateName);

        if (this.#timeouts[key]) {
            this.clearTimeout(this.#timeouts[key]);
            delete this.#timeouts[key];
        }
    }

    async #scheduleExpiration(setName: string, stateName: string, expiresAt: DateTime): Promise<void> {
        this.#clearTimeout(setName, stateName);

        const diff = expiresAt.diff(DateTime.now()).as('milliseconds');

        if (diff <= 0) {
            await this.deactivateState(setName, stateName);
            return;
        }

        const key = this.#timeoutKey(setName, stateName);

        this.#timeouts[key] = this.setTimeout(async () => {
            delete this.#timeouts[key];
            await this.deactivateState(setName, stateName);
        }, diff);

        this.log(`Scheduled expiration for ${setName}:${stateName} in ${Math.round(diff / 1000)}s`);
    }

    async #scheduleExpirations(): Promise<void> {
        for (const key of Object.keys(this.#timeouts)) {
            this.clearTimeout(this.#timeouts[key]);
        }

        this.#timeouts = {};

        for (const [setName, setStates] of Object.entries(this.states)) {
            for (const [stateName, [active, , expiresAt]] of Object.entries(setStates)) {
                if (!(active && expiresAt)) {
                    continue;
                }

                await this.#scheduleExpiration(setName, stateName, DateTime.fromISO(expiresAt));
            }
        }
    }

    #setAutocompleteProvider(): AutocompleteProviders.Set {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.Set);

        if (!provider) {
            throw new Error('Failed to get the set autocomplete provider.');
        }

        return provider;
    }

    #setStateAutocompleteProvider(): AutocompleteProviders.SetState {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.SetState);

        if (!provider) {
            throw new Error('Failed to get the set state autocomplete provider.');
        }

        return provider;
    }
}
