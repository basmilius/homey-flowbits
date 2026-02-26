import { randomInt } from 'node:crypto';
import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';

import facts from '../../data/facts';

@action('random_fact')
export default class extends FlowActionEntity<FlowBitsApp, never, never, Result> {
    async onRun(): Promise<Result> {
        const locale = this.language as 'nl' | 'en';
        const fact = facts[randomInt(0, facts.length)];
        const randomFact = locale in fact ? fact[locale] : fact['en'];

        return {
            randomFact
        };
    }
}

type Result = {
    readonly randomFact: string;
};
