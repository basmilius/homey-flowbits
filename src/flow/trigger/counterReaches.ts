import { FlowTriggerEntity, trigger } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@trigger('counter_reaches')
export default class extends FlowTriggerEntity<FlowBitsApp, Args, State> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('counter', AutocompleteProviders.Counter);

        await super.onInit();
    }

    async onRun(args: Args, state: State): Promise<boolean> {
        return args.counter.name === state.counter && args.value === state.value;
    }
}

type Args = {
    readonly counter: {
        readonly name: string;
    };
    readonly value: number;
};

type State = {
    readonly counter: string;
    readonly value: number;
};
