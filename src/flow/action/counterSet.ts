import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('counter_set')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('counter', AutocompleteProviders.Counter);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.counters.setValue(args.counter.name, args.value);
    }
}

type Args = {
    readonly counter: {
        readonly name: string;
    };
    readonly value: number;
};
