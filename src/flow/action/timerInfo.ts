import { action, DateTime, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';
import { formatSecondsToTime } from '../../util';

@action('timer_info')
export default class extends FlowActionEntity<FlowBitsApp, Args, never, Tokens> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('timer', AutocompleteProviders.Timer);

        await super.onInit();
    }

    async onRun(args: Args): Promise<Tokens> {
        const timer = await this.app.timers.find(args.timer.name);

        if (!timer) {
            throw new Error(`Timer "${args.timer.name}" not found.`);
        }

        // Calculate remaining seconds based on timer state
        let remainingSeconds = 0;
        if (timer.status === 'running') {
            const now = DateTime.now().toSeconds();
            remainingSeconds = Math.max(0, Math.floor(timer.target - now));
        } else if (timer.status === 'paused') {
            remainingSeconds = Math.max(0, Math.floor(timer.remaining));
        }

        // Format remaining time as HH:MM:SS or dash
        const remainingTime = formatSecondsToTime(remainingSeconds);

        return {
            status: timer.status,
            remaining_time: remainingTime,
            remaining_seconds: remainingSeconds
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
