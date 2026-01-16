import { action, DateTime, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { roundStep } from '../../util';

@action('utility_percentage_between_timestamps')
export default class extends FlowActionEntity<FlowBitsApp, Args, never, Tokens> {
    async onRun(args: Args): Promise<Tokens> {
        const now = DateTime.now();

        let fromDate = DateTime.fromFormat(args.from, 'HH:mm');
        let toDate = DateTime.fromFormat(args.to, 'HH:mm');

        if (fromDate > toDate) {
            toDate = toDate.plus({days: 1});
        }

        let currentTime = now;
        if (currentTime < fromDate && fromDate > DateTime.fromFormat(args.to, 'HH:mm')) {
            currentTime = currentTime.plus({days: 1});
        }

        const totalDuration = toDate.diff(fromDate).as('milliseconds');
        const elapsed = currentTime.diff(fromDate).as('milliseconds');

        const fraction = roundStep(Math.max(0, Math.min(1, elapsed / totalDuration)), 0.005);
        const percentage = fraction * 100;

        return {
            fraction,
            percentage
        };
    }
}

type Args = {
    readonly from: string;
    readonly to: string;
};

type Tokens = {
    readonly fraction: number;
    readonly percentage: number;
};
