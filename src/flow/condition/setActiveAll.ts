import { condition, FlowConditionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@condition('set_active_all')
export default class extends FlowConditionEntity<FlowBitsApp, Args, never> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.Set);

        await super.onInit();
    }

    async onRun(args: Args): Promise<boolean> {
        return this.app.sets.isActiveAll(args.set.name);
    }
}

type Args = {
    readonly set: {
        readonly name: string;
    };
};
