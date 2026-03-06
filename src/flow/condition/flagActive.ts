import { condition, FlowConditionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';

@condition('flag_active')
export default class extends FlowConditionEntity<FlowBitsApp, never, never> {
    async onRun(): Promise<boolean> {
        return this.app.flags.currentFlags.length > 0;
    }

    async onUpdate(): Promise<void> {
        await this.app.flags.update();
        await super.onUpdate();
    }
}
