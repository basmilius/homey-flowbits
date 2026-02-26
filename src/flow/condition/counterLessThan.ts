import { condition, FlowConditionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@condition('counter_less_than')
export default class extends FlowConditionEntity<FlowBitsApp, Args, never> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('counter', AutocompleteProviders.Counter);

        await super.onInit();
    }

    async onRun(args: Args): Promise<boolean> {
        const value = await this.app.counters.getValue(args.counter.name);
        return value < args.value;
    }
}

type Args = {
    readonly counter: {
        readonly name: string;
    };
    readonly value: number;
};
