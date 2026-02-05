import { autocomplete, FlowAutocompleteArgumentProvider, type FlowCard } from '@basmilius/homey-common';
import type Homey from 'homey';
import type { FlowBitsApp } from '../../types';

@autocomplete('mode')
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
                description: this.translate('autocomplete.mode_new')
            });
        }

        return results;
    }

    getCards(): FlowCard[] {
        return [
            this.flow.getActionCard('mode_activate'),
            this.flow.getActionCard('mode_activate_for'),
            this.flow.getActionCard('mode_deactivate'),
            this.flow.getActionCard('mode_reactivate'),
            this.flow.getActionCard('mode_toggle'),
            this.flow.getConditionCard('mode_is'),
            this.flow.getConditionCard('mode_is_active_for'),
            this.flow.getConditionCard('mode_is_inactive_for'),
            this.flow.getTriggerCard('mode_activated'),
            this.flow.getTriggerCard('mode_changed'),
            this.flow.getTriggerCard('mode_deactivated')
        ];
    }

    mapArgument(value: any): string {
        return value.name.name;
    }

    async update(): Promise<void> {
        await super.update();
        await this.app.modes.update();
    }
}
