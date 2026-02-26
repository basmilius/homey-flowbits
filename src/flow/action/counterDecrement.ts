import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('counter_decrement')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('counter', AutocompleteProviders.Counter);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.counters.decrement(args.counter.name, args.amount);
    }
}

type Args = {
    readonly counter: {
        readonly name: string;
    };
    readonly amount: number;
};
