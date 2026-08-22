import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('mode_set_reactivate_current')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.ModeSet);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.modeSets.reactivateCurrent(args.set.name);
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
