import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('event_trigger_with_value')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('event', AutocompleteProviders.Event);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.events.trigger(args.event.name, args.value);
    }
}

type Args = {
    readonly event: {
        readonly name: string;
    };
    readonly value: string;
};
