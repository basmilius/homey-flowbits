import { FlowTriggerEntity, trigger } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@trigger('mode_set_current_changed')
export default class extends FlowTriggerEntity<FlowBitsApp, Args, State, Tokens> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.ModeSet);

        await super.onInit();
    }

    async onRun(args: Args, state: State): Promise<boolean> {
        return args.set.name === state.set;
    }

    async onUpdate(): Promise<void> {
        await this.app.modeSets.update();
        await super.onUpdate();
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

type Tokens = {
    readonly mode: string;
};
