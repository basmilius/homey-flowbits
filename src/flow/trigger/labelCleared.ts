import { FlowTriggerEntity, trigger } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@trigger('label_cleared')
export default class extends FlowTriggerEntity<FlowBitsApp, Args, State> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('label', AutocompleteProviders.Label);

        await super.onInit();
    }

    async onRun(args: Args, state: State): Promise<boolean> {
        return args.label.name === state.name;
    }
}

type Args = {
    readonly label: {
        readonly name: string;
    };
};

type State = {
    readonly name: string;
};
