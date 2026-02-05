import { condition, FlowConditionEntity } from '@basmilius/homey-common';
import type { ClockUnit, FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@condition('flag_is_active_for')
export default class extends FlowConditionEntity<FlowBitsApp, Args, never> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('flag', AutocompleteProviders.Flag);

        await super.onInit();
    }

    async onRun(args: Args): Promise<boolean> {
        return this.app.flags.isActiveFor(args.flag.name, args.duration, args.unit);
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
