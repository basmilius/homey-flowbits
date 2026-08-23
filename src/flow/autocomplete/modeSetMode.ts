import { autocomplete, FlowAutocompleteArgumentProvider, type FlowCard } from '@basmilius/homey-common';
import type Homey from 'homey';
import type { FlowBitsApp } from '../../types';

type Value = {
    readonly set: string;
    readonly mode: string;
};

@autocomplete('mode_set_mode')
export default class extends FlowAutocompleteArgumentProvider<FlowBitsApp, Value> {
    async find(query: string, args: Record<string, unknown>): Promise<Homey.FlowCard.ArgumentAutocompleteResults> {
        const hasQuery = query.trim().length > 0;
        const selectedSet = (args.set as { name?: string } | undefined)?.name;

        // Scope the modes to the selected set, falling back to all modes when no set is chosen yet.
        const scoped = selectedSet
            ? this.values.filter(value => value.set === selectedSet)
            : this.values;

        const results: Homey.FlowCard.ArgumentAutocompleteResults = scoped
            .filter(({mode}) => !hasQuery || mode.toLowerCase().includes(query.toLowerCase()))
            .map(({set, mode}) => ({name: mode, set}))
            .sort((a, b) => a.name.localeCompare(b.name))
            .filter((value, index, arr) => arr.findIndex(v => v.name === value.name) === index);

        if (hasQuery && !scoped.some(({mode}) => query === mode)) {
            results.push({
                name: query,
                description: this.translate('autocomplete.mode_set_mode_new')
            });
        }

        return results;
    }

    getCards(): FlowCard[] {
        return [
            this.flow.getActionCard('mode_set_activate'),
            this.flow.getActionCard('mode_set_activate_for'),
            this.flow.getActionCard('mode_set_deactivate'),
            this.flow.getActionCard('mode_set_reactivate'),
            this.flow.getActionCard('mode_set_toggle'),
            this.flow.getConditionCard('mode_set_is'),
            this.flow.getConditionCard('mode_set_is_active_for'),
            this.flow.getConditionCard('mode_set_is_inactive_for'),
            this.flow.getTriggerCard('mode_set_activated'),
            this.flow.getTriggerCard('mode_set_changed'),
            this.flow.getTriggerCard('mode_set_deactivated')
        ];
    }

    mapArgument(value: any): Value {
        return {
            set: value.set.name,
            mode: value.mode.name
        };
    }

    async update(): Promise<void> {
        await super.update();
        await this.app.modeSets.update();
    }
}
