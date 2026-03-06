import { FlowTriggerEntity, trigger } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@trigger('event_triggered')
export default class extends FlowTriggerEntity<FlowBitsApp, Args, State, Tokens> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('event', AutocompleteProviders.Event);

        await super.onInit();
    }

    async onRun(args: Args, state: State): Promise<boolean> {
        return args.event.name === state.name;
    }
}

type Args = {
    readonly event: {
        readonly name: string;
    };
};

type State = {
    readonly name: string;
};

type Tokens = {
    readonly value: string;
};
