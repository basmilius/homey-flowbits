import { autocomplete, FlowAutocompleteArgumentProvider, type FlowCard } from '@basmilius/homey-common';
import type Homey from 'homey';
import type { FlowBitsApp } from '../../types';

@autocomplete('counter')
export default class extends FlowAutocompleteArgumentProvider<FlowBitsApp> {
    async find(query: string): Promise<Homey.FlowCard.ArgumentAutocompleteResults> {
        const hasQuery = query.trim().length > 0;

        const results: Homey.FlowCard.ArgumentAutocompleteResults = this.values
            .filter(name => !hasQuery || name.toLowerCase().includes(query.toLowerCase()))
            .map(name => ({name}))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (hasQuery && !this.values.some(name => query === name)) {
            results.unshift({
                name: query,
                description: this.translate('autocomplete.counter_new')
            });
        }

        return results;
    }

    getCards(): FlowCard[] {
        return [
            this.flow.getActionCard('counter_decrement'),
            this.flow.getActionCard('counter_increment'),
            this.flow.getActionCard('counter_reset'),
            this.flow.getActionCard('counter_set'),
            this.flow.getConditionCard('counter_between'),
            this.flow.getConditionCard('counter_equals'),
            this.flow.getConditionCard('counter_greater_than'),
            this.flow.getConditionCard('counter_less_than'),
            this.flow.getTriggerCard('counter_changed'),
            this.flow.getTriggerCard('counter_reaches')
        ];
    }

    mapArgument(value: any): string {
        return value.counter.name;
    }
}
