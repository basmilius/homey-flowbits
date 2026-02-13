import { autocomplete, FlowAutocompleteArgumentProvider, type FlowCard } from '@basmilius/homey-common';
import type Homey from 'homey';
import type { FlowBitsApp } from '../../types';

@autocomplete('timer')
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
                description: this.translate('autocomplete.timer_new')
            });
        }

        return results;
    }

    getCards(): FlowCard[] {
        return [
            this.flow.getActionCard('timer_pause'),
            this.flow.getActionCard('timer_resume'),
            this.flow.getActionCard('timer_set'),
            this.flow.getActionCard('timer_set_between'),
            this.flow.getActionCard('timer_start'),
            this.flow.getActionCard('timer_start_between'),
            this.flow.getActionCard('timer_start_repeating'),
            this.flow.getActionCard('timer_start_repeating_between'),
            this.flow.getActionCard('timer_stop'),
            this.flow.getConditionCard('timer_duration'),
            this.flow.getConditionCard('timer_finished'),
            this.flow.getConditionCard('timer_paused'),
            this.flow.getConditionCard('timer_running'),
            this.flow.getTriggerCard('timer_finished'),
            this.flow.getTriggerCard('timer_paused'),
            this.flow.getTriggerCard('timer_remaining'),
            this.flow.getTriggerCard('timer_resumed'),
            this.flow.getTriggerCard('timer_started'),
            this.flow.getTriggerCard('timer_stopped')
        ];
    }

    mapArgument(value: any): string {
        return value.timer.name;
    }
}
