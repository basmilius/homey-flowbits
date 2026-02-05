import { condition, FlowConditionEntity } from '@basmilius/homey-common';
import type { ClockUnit, FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@condition('mode_is_active_for')
export default class extends FlowConditionEntity<FlowBitsApp, Args, never> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('name', AutocompleteProviders.Mode);

        await super.onInit();
    }

    async onRun(args: Args): Promise<boolean> {
        return this.app.modes.isActiveFor(args.name.name, args.duration, args.unit);
    }

    async onUpdate(): Promise<void> {
        await this.app.modes.update();
        await super.onUpdate();
    }
}

type Args = {
    readonly duration: number;
    readonly name: {
        readonly name: string;
    };
    readonly unit: ClockUnit;
};
