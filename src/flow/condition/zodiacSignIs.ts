import { condition, DateTime, FlowConditionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { getZodiacSign, type ZodiacSign } from '../../util';

@condition('zodiac_sign_is')
export default class extends FlowConditionEntity<FlowBitsApp, Args, never> {
    async onRun(args: Args): Promise<boolean> {
        const now = DateTime.now();
        const zodiacSign = getZodiacSign(now);

        return zodiacSign === args.value;
    }
}

type Args = {
    readonly value: ZodiacSign;
};
