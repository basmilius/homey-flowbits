import { Shortcuts } from '@basmilius/homey-common';
import { REALTIME_SETS_UPDATE, SETTING_SET_LOOKS, SETTING_SETS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { ClockUnit, Feature, FlowBitsApp, Look, Set, SetState, Styleable } from '../types';

type StoredSet = Record<string, [active: boolean, lastUpdate: string | null, expiresAt: string | null]>;
type StoredSets = Record<string, StoredSet>;

export default class Sets extends Shortcuts<FlowBitsApp> implements Feature<Set>, Styleable {
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

    async cleanup(): Promise<void> {
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
        const setProvider = this.#setAutocompleteProvider();
        const definedSets = await setProvider.find('');

        if (definedSets.length === 0) {
            return [];
        }

        const storedStates = this.states;
        const results: Set[] = [];

        for (const set of definedSets) {
            const look = await this.getLook(set.name);
            const setStates = storedStates[set.name] ?? {};

            const states: SetState[] = Object.entries(setStates)
                .map(([name, [active, lastUpdate, expiresAt]]) => ({
                    name,
                    active,
                    lastUpdate: lastUpdate ?? undefined,
                    expiresAt: expiresAt ?? undefined
                }));

            const activeStates = states.filter(state => state.active);

            results.push({
                name: set.name,
                color: look[0],
                icon: look[1],
                states,
                anyActive: activeStates.length > 0,
                allActive: states.length > 0 && activeStates.length === states.length
            });
        }

        return results;
    }

    async activateAll(setName: string): Promise<void> {
    }

    async activateState(setName: string, stateName: string): Promise<void> {
    }

    async activateStateExclusive(setName: string, stateName: string): Promise<void> {
    }

    async activateStateFor(setName: string, stateName: string, duration: number, unit: ClockUnit): Promise<void> {
    }

    async deactivateAll(setName: string): Promise<void> {
    }

    async deactivateState(setName: string, stateName: string): Promise<void> {
    }

    async toggleState(setName: string, stateName: string): Promise<void> {
    }

    async toggleStateFor(setName: string, stateName: string, duration: number, unit: ClockUnit): Promise<void> {
    }

    async isActiveAll(setName: string): Promise<boolean> {
        return false;
    }

    async isActiveAny(setName: string): Promise<boolean> {
        return false;
    }

    async isInactive(setName: string): Promise<boolean> {
        return true;
    }

    async isStateActive(setName: string, stateName: string): Promise<boolean> {
        return false;
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
