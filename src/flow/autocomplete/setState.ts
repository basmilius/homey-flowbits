import { autocomplete, FlowAutocompleteArgumentProvider, type FlowCard } from '@basmilius/homey-common';
import type Homey from 'homey';
import type { FlowBitsApp } from '../../types';

type Value = {
    readonly set: string;
    readonly state: string;
};

@autocomplete('set_state')
export default class extends FlowAutocompleteArgumentProvider<FlowBitsApp, Value> {
    async find(query: string, args: Record<string, unknown>): Promise<Homey.FlowCard.ArgumentAutocompleteResults> {
        const hasQuery = query.trim().length > 0;
        const selectedSet = (args.set as { name?: string } | undefined)?.name;

        // Scope the states to the selected set, falling back to all states when no set is chosen yet.
        const scoped = selectedSet
            ? this.values.filter(value => value.set === selectedSet)
            : this.values;

        const results: Homey.FlowCard.ArgumentAutocompleteResults = scoped
            .filter(({state}) => !hasQuery || state.toLowerCase().includes(query.toLowerCase()))
            .map(({set, state}) => ({name: state, set}))
            .sort((a, b) => a.name.localeCompare(b.name))
            .filter((value, index, arr) => arr.findIndex(v => v.name === value.name) === index);

        if (hasQuery && !scoped.some(({state}) => query === state)) {
            results.push({
                name: query,
                description: this.translate('autocomplete.set_state_new')
            });
        }

        return results;
    }

    getCards(): FlowCard[] {
        return [
            this.flow.getActionCard('set_activate_state'),
            this.flow.getActionCard('set_activate_state_exclusive'),
            this.flow.getActionCard('set_activate_state_exclusive_for'),
            this.flow.getActionCard('set_activate_state_for'),
            this.flow.getActionCard('set_deactivate_state'),
            this.flow.getActionCard('set_toggle_state'),
            this.flow.getActionCard('set_toggle_state_for'),
            this.flow.getConditionCard('set_state_is'),
            this.flow.getTriggerCard('set_state_activated'),
            this.flow.getTriggerCard('set_state_changed'),
            this.flow.getTriggerCard('set_state_deactivated')
        ];
    }

    mapArgument(value: any): Value {
        return {
            set: value.set.name,
            state: value.state.name
        };
    }

    async update(): Promise<void> {
        await super.update();
        await this.app.sets.update();
    }
}
