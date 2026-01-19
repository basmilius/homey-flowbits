import { autocomplete, FlowAutocompleteArgumentProvider, type FlowCard } from '@basmilius/homey-common';
import type Homey from 'homey';
import type { FlowBitsApp } from '../../types';

@autocomplete('set_state')
export default class extends FlowAutocompleteArgumentProvider<FlowBitsApp> {
    async find(query: string): Promise<Homey.FlowCard.ArgumentAutocompleteResults> {
        return [];
    }

    getCards(): FlowCard[] {
        return [
            this.flow.getActionCard('set_activate_state'),
            this.flow.getActionCard('set_activate_state_exclusive'),
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

    mapArgument(value: any): string {
        return value.state.name;
    }

    async update(): Promise<void> {
        await super.update();
        // await this.app.sets.update();
    }
}
