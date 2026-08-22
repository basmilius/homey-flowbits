import { condition, FlowConditionEntity } from '@basmilius/homey-common';
import type { ClockUnit, FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@condition('mode_set_is_inactive_for')
export default class extends FlowConditionEntity<FlowBitsApp, Args, never> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.ModeSet);
        this.registerAutocomplete('mode', AutocompleteProviders.ModeSetMode);

        await super.onInit();
    }

    async onRun(args: Args): Promise<boolean> {
        return this.app.modeSets.isInactiveFor(args.set.name, args.mode.name, args.duration, args.unit);
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
