import { condition, FlowConditionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@condition('schedule_is_active')
export default class extends FlowConditionEntity<FlowBitsApp, Args, never> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('schedule', AutocompleteProviders.Schedule);

        await super.onInit();
    }

    async onRun(args: Args): Promise<boolean> {
        return this.app.schedules.isActive(args.schedule.name);
    }
}

type Args = {
    readonly schedule: {
        readonly name: string;
    };
};
