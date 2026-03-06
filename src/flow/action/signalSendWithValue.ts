import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('signal_send_with_value')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('signal', AutocompleteProviders.Signal);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.signals.send(args.signal.name, args.value);
    }
}

type Args = {
    readonly signal: {
        readonly name: string;
    };
    readonly value: string;
};
