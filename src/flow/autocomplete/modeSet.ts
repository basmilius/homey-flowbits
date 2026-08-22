import { autocomplete, FlowAutocompleteArgumentProvider, type FlowCard } from '@basmilius/homey-common';
import type Homey from 'homey';
import type { FlowBitsApp } from '../../types';

@autocomplete('mode_set')
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
                description: this.translate('autocomplete.mode_set_new')
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
            this.flow.getActionCard('mode_set_reactivate_current'),
            this.flow.getActionCard('mode_set_toggle'),
            this.flow.getConditionCard('mode_set_active'),
            this.flow.getConditionCard('mode_set_is'),
            this.flow.getConditionCard('mode_set_is_active_for'),
            this.flow.getConditionCard('mode_set_is_inactive_for'),
            this.flow.getTriggerCard('mode_set_activated'),
            this.flow.getTriggerCard('mode_set_changed'),
            this.flow.getTriggerCard('mode_set_current_changed'),
            this.flow.getTriggerCard('mode_set_deactivated')
        ];
    }

    mapArgument(value: any): string {
        return value.set.name;
    }
}
