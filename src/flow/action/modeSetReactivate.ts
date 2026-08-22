import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('mode_set_reactivate')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.ModeSet);
        this.registerAutocomplete('mode', AutocompleteProviders.ModeSetMode);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.modeSets.reactivate(args.set.name, args.mode.name);
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
