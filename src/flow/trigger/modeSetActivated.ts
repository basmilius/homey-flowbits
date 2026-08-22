import { FlowTriggerEntity, trigger } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@trigger('mode_set_activated')
export default class extends FlowTriggerEntity<FlowBitsApp, Args, State> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.ModeSet);
        this.registerAutocomplete('mode', AutocompleteProviders.ModeSetMode);

        await super.onInit();
    }

    async onRun(args: Args, state: State): Promise<boolean> {
        return args.set.name === state.set && args.mode.name === state.mode;
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
    readonly mode: {
        readonly name: string;
    };
};

type State = {
    readonly set: string;
    readonly mode: string;
};
