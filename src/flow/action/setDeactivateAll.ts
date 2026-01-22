import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('set_deactivate_all')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.Set);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.sets.deactivateAll(args.set.name);
    }
}

type Args = {
    readonly set: {
        readonly name: string;
    };
};
