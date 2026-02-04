import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';

@action('mode_reactivate_current')
export default class extends FlowActionEntity<FlowBitsApp> {
    async onRun(): Promise<void> {
        await this.app.modes.reactivateCurrent();
    }

    async onUpdate(): Promise<void> {
        await this.app.modes.update();
        await super.onUpdate();
    }
}
