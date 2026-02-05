import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { ClockUnit, FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('flag_activate_for')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('flag', AutocompleteProviders.Flag);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.flags.activateFor(args.flag.name, args.duration, args.unit);
    }

    async onUpdate(): Promise<void> {
        await this.app.flags.update();
        await super.onUpdate();
    }
}

type Args = {
    readonly duration: number;
    readonly flag: {
        readonly name: string;
    };
    readonly unit: ClockUnit;
};
