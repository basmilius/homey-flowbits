import { autocomplete, FlowAutocompleteArgumentProvider, type FlowCard } from '@basmilius/homey-common';
import type Homey from 'homey';
import type { FlowBitsApp } from '../../types';

@autocomplete('event')
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
                description: this.translate('autocomplete.event_new')
            });
        }

        return results;
    }

    getCards(): FlowCard[] {
        return [
            this.flow.getActionCard('event_clear'),
            this.flow.getActionCard('event_trigger'),
            this.flow.getActionCard('event_trigger_with_value'),
            this.flow.getConditionCard('event_happened'),
            this.flow.getConditionCard('event_happened_times_today'),
            this.flow.getConditionCard('event_happened_times_within'),
            this.flow.getConditionCard('event_happened_today'),
            this.flow.getConditionCard('event_happened_within'),
            this.flow.getTriggerCard('event_cleared'),
            this.flow.getTriggerCard('event_triggered')
        ];
    }

    mapArgument(value: any): string {
        return value.event.name;
    }
}
