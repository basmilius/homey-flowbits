import { condition, FlowConditionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@condition('set_state_is')
export default class extends FlowConditionEntity<FlowBitsApp, Args, never> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.Set);
        this.registerAutocomplete('state', AutocompleteProviders.SetState);

        await super.onInit();
    }

    async onRun(args: Args): Promise<boolean> {
        return this.app.sets.isStateActive(args.set.name, args.state.name);
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
