import { FlowTriggerEntity, trigger } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';

@trigger('mode_current_changed')
export default class extends FlowTriggerEntity<FlowBitsApp, unknown, unknown, Tokens> {
    async onRun(): Promise<boolean> {
        return true;
    }
}

type Tokens = {
    readonly mode: string;
};
