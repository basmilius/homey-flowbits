import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('set_toggle_state')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.Set);
        this.registerAutocomplete('state', AutocompleteProviders.SetState);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.sets.toggleState(args.set.name, args.state.name);
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
