import { FlowTriggerEntity, trigger } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@trigger('signal_receive')
export default class extends FlowTriggerEntity<FlowBitsApp, Args, State, Tokens> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('signal', AutocompleteProviders.Signal);

        await super.onInit();
    }

    async onRun(args: Args, state: State): Promise<boolean> {
        return args.signal.name === state.signal;
    }
}

type Args = {
    readonly signal: {
        readonly name: string;
    };
};

type State = {
    readonly signal: string;
};

type Tokens = {
    readonly value: string;
};
