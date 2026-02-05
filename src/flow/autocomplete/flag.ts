import { autocomplete, FlowAutocompleteArgumentProvider, type FlowCard } from '@basmilius/homey-common';
import type Homey from 'homey';
import type { FlowBitsApp } from '../../types';

@autocomplete('flag')
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
                description: this.translate('autocomplete.flag_new')
            });
        }

        return results;
    }

    getCards(): FlowCard[] {
        return [
            this.flow.getActionCard('flag_activate'),
            this.flow.getActionCard('flag_activate_for'),
            this.flow.getActionCard('flag_deactivate'),
            this.flow.getActionCard('flag_toggle'),
            this.flow.getConditionCard('flag_is'),
            this.flow.getConditionCard('flag_is_active_for'),
            this.flow.getConditionCard('flag_is_inactive_for'),
            this.flow.getTriggerCard('flag_activated'),
            this.flow.getTriggerCard('flag_changed'),
            this.flow.getTriggerCard('flag_deactivated')
        ];
    }

    mapArgument(value: any): string {
        return value.flag.name;
    }

    async update(): Promise<void> {
        await super.update();
        await this.app.flags.update();
    }
}
