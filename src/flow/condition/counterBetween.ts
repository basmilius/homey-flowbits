import { condition, FlowConditionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@condition('counter_between')
export default class extends FlowConditionEntity<FlowBitsApp, Args, never> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('counter', AutocompleteProviders.Counter);

        await super.onInit();
    }

    async onRun(args: Args): Promise<boolean> {
        const value = await this.app.counters.getValue(args.counter.name);
        return value >= args.min && value <= args.max;
    }
}

type Args = {
    readonly counter: {
        readonly name: string;
    };
    readonly min: number;
    readonly max: number;
};
