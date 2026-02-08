import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { formatSecondsToTime } from '../../util';
import { AutocompleteProviders } from '..';

@action('timer_info')
export default class extends FlowActionEntity<FlowBitsApp, Args, never, Tokens> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('timer', AutocompleteProviders.Timer);

        await super.onInit();
    }

    async onRun(args: Args): Promise<Tokens> {
        const info = await this.app.timers.getInfo(args.timer.name);

        return {
            status: info.status,
            remaining_time: formatSecondsToTime(info.remainingSeconds),
            remaining_seconds: info.remainingSeconds
        };
    }
}

type Args = {
    readonly timer: {
        readonly name: string;
    };
};

type Tokens = {
    readonly status: string;
    readonly remaining_time: string;
    readonly remaining_seconds: number;
};
