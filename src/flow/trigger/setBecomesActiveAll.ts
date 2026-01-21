import { FlowTriggerEntity, trigger } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@trigger('set_becomes_active_all')
export default class extends FlowTriggerEntity<FlowBitsApp, Args, State> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.Set);

        await super.onInit();
    }

    async onRun(args: Args, state: State): Promise<boolean> {
        return args.set.name === state.set;
    }
}

type Args = {
    readonly set: {
        readonly name: string;
    };
};

type State = {
    readonly set: string;
};
