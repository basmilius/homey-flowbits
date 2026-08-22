import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { ClockUnit, FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('mode_set_activate_for')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.ModeSet);
        this.registerAutocomplete('mode', AutocompleteProviders.ModeSetMode);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.modeSets.activateFor(args.set.name, args.mode.name, args.duration, args.unit);
    }

    async onUpdate(): Promise<void> {
        await this.app.modeSets.update();
        await super.onUpdate();
    }
}

type Args = {
    readonly duration: number;
    readonly set: {
        readonly name: string;
    };
    readonly mode: {
        readonly name: string;
    };
    readonly unit: ClockUnit;
};
