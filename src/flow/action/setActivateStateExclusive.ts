import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('set_activate_state_exclusive')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.Set);
        this.registerAutocomplete('state', AutocompleteProviders.SetState);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.sets.activateStateExclusive(args.set.name, args.state.name);
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
