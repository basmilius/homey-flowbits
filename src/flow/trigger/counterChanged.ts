import { FlowTriggerEntity, trigger } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@trigger('counter_changed')
export default class extends FlowTriggerEntity<FlowBitsApp, Args, State, Tokens> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('counter', AutocompleteProviders.Counter);

        await super.onInit();
    }

    async onRun(args: Args, state: State): Promise<boolean> {
        return args.counter.name === state.counter;
    }
}

type Args = {
    readonly counter: {
        readonly name: string;
    };
};

type State = {
    readonly counter: string;
};

type Tokens = {
    readonly value: number;
};
