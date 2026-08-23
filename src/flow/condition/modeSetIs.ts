import { condition, FlowConditionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@condition('mode_set_is')
export default class extends FlowConditionEntity<FlowBitsApp, Args, never> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.ModeSet);
        this.registerAutocomplete('mode', AutocompleteProviders.ModeSetMode);

        await super.onInit();
    }

    async onRun(args: Args): Promise<boolean> {
        return this.app.modeSets.isModeActive(args.set.name, args.mode.name);
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
