import { FlowTriggerEntity, trigger } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@trigger('set_state_changed')
export default class extends FlowTriggerEntity<FlowBitsApp, Args, State, Tokens> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.Set);
        this.registerAutocomplete('state', AutocompleteProviders.SetState);

        await super.onInit();
    }

    async onRun(args: Args, state: State): Promise<boolean> {
        return args.set.name === state.set && args.state.name === state.state;
    }
}

type Args = {
    readonly set: {
        readonly name: string;
    };
    readonly state: {
        readonly name: string;
    };
};

type State = {
    readonly set: string;
    readonly state: string;
};

type Tokens = {
    readonly active: boolean;
};
