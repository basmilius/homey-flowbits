import { randomInt } from 'node:crypto';
import { condition, FlowConditionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';

@condition('dice_rolls')
export default class extends FlowConditionEntity<FlowBitsApp, Args, never> {
    async onRun(args: Args): Promise<boolean> {
        return randomInt(1, 7) === args.result;
    }
}

type Args = {
    readonly result: number;
};
