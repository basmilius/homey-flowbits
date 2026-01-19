import { autocomplete, FlowAutocompleteArgumentProvider, type FlowCard } from '@basmilius/homey-common';
import type Homey from 'homey';
import type { FlowBitsApp } from '../../types';

@autocomplete('set')
export default class extends FlowAutocompleteArgumentProvider<FlowBitsApp> {
    async find(query: string): Promise<Homey.FlowCard.ArgumentAutocompleteResults> {
        return [];
    }

    getCards(): FlowCard[] {
        return [
            this.flow.getActionCard('set_activate_state'),
        ];
    }

    mapArgument(value: any): string {
        return value.set.name;
    }

    async update(): Promise<void> {
        await super.update();
        // await this.app.sets.update();
    }
}
