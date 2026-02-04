import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { ClockUnit, FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('timer_set_between')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('timer', AutocompleteProviders.Timer);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.timers.setBetween(args.timer.name, args.duration1, args.unit1, args.duration2, args.unit2);
    }
}

type Args = {
    readonly duration1: number;
    readonly duration2: number;
    readonly timer: {
        readonly name: string;
    };
    readonly unit1: ClockUnit;
    readonly unit2: ClockUnit;
};
