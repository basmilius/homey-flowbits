import { condition, FlowConditionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';

@condition('mode_active')
export default class extends FlowConditionEntity<FlowBitsApp, never, never> {
    async onRun(): Promise<boolean> {
        return this.app.modes.currentMode !== null;
    }

    async onUpdate(): Promise<void> {
        await this.app.modes.update();
        await super.onUpdate();
    }
}
