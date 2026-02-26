import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp, ScheduleDays } from '../../types';
import { AutocompleteProviders } from '..';

@action('schedule_configure')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('schedule', AutocompleteProviders.Schedule);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.schedules.configure(
            args.schedule.name,
            args.start_time,
            args.end_time,
            args.days as ScheduleDays
        );
    }
}

type Args = {
    readonly schedule: {
        readonly name: string;
    };
    readonly start_time: string;
    readonly end_time: string;
    readonly days: string;
};
