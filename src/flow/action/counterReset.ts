import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('counter_reset')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('counter', AutocompleteProviders.Counter);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.counters.reset(args.counter.name);
    }
}

type Args = {
    readonly counter: {
        readonly name: string;
    };
};
