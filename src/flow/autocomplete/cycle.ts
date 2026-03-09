import { autocomplete, FlowAutocompleteArgumentProvider, type FlowCard } from '@basmilius/homey-common';
import type Homey from 'homey';
import type { FlowBitsApp } from '../../types';

@autocomplete('cycle')
export default class extends FlowAutocompleteArgumentProvider<FlowBitsApp> {
    async find(query: string): Promise<Homey.FlowCard.ArgumentAutocompleteResults> {
        const hasQuery = query.trim().length > 0;

        const results: Homey.FlowCard.ArgumentAutocompleteResults = this.values
            .filter(name => !hasQuery || name.toLowerCase().includes(query.toLowerCase()))
            .map(name => ({name}))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (hasQuery && !this.values.some(name => query === name)) {
            results.push({
                name: query,
                description: this.translate('autocomplete.cycle_new')
            });
        }

        return results;
    }

    getCards(): FlowCard[] {
        return [
            this.flow.getActionCard('cycle'),
            this.flow.getActionCard('cycle_between'),
            this.flow.getActionCard('cycle_to'),
            this.flow.getConditionCard('cycle_has_value'),
            this.flow.getConditionCard('cycle_higher_than_or_equal'),
            this.flow.getConditionCard('cycle_lower_than_or_equal'),
            this.flow.getTriggerCard('cycle_becomes'),
            this.flow.getTriggerCard('cycle_updates')
        ];
    }

    mapArgument(value: any): string {
        return value.name.name;
    }
}
