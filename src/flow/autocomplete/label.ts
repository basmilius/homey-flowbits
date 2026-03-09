import { autocomplete, FlowAutocompleteArgumentProvider, type FlowCard } from '@basmilius/homey-common';
import type Homey from 'homey';
import type { FlowBitsApp } from '../../types';

@autocomplete('label')
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
                description: this.translate('autocomplete.label_new')
            });
        }

        return results;
    }

    getCards(): FlowCard[] {
        return [
            this.flow.getActionCard('label_clear'),
            this.flow.getActionCard('label_set'),
            this.flow.getConditionCard('label_has_value'),
            this.flow.getTriggerCard('label_becomes'),
            this.flow.getTriggerCard('label_changed'),
            this.flow.getTriggerCard('label_changed_v2'),
            this.flow.getTriggerCard('label_cleared')
        ];
    }

    mapArgument(value: any): string {
        return value.label.name;
    }
}
