import { autocomplete, FlowAutocompleteArgumentProvider, type FlowCard } from '@basmilius/homey-common';
import type Homey from 'homey';
import type { FlowBitsApp } from '../../types';

@autocomplete('mode_group')
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
                description: this.translate('autocomplete.mode_group_new')
            });
        }

        return results;
    }

    getCards(): FlowCard[] {
        return [
            this.flow.getActionCard('mode_group_activate'),
            this.flow.getActionCard('mode_group_activate_for'),
            this.flow.getActionCard('mode_group_activate_for_revert'),
            this.flow.getActionCard('mode_group_deactivate'),
            this.flow.getActionCard('mode_group_reactivate'),
            this.flow.getActionCard('mode_group_reactivate_current'),
            this.flow.getActionCard('mode_group_toggle'),
            this.flow.getConditionCard('mode_group_active'),
            this.flow.getConditionCard('mode_group_is'),
            this.flow.getConditionCard('mode_group_is_active_for'),
            this.flow.getConditionCard('mode_group_is_inactive_for'),
            this.flow.getTriggerCard('mode_group_activated'),
            this.flow.getTriggerCard('mode_group_changed'),
            this.flow.getTriggerCard('mode_group_current_changed'),
            this.flow.getTriggerCard('mode_group_deactivated')
        ];
    }

    mapArgument(value: any): string {
        return value.group.name;
    }

    async update(): Promise<void> {
        await super.update();
        await this.app.modes.update();
    }
}
