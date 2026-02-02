import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { ClockUnit, FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('set_activate_state_for')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('set', AutocompleteProviders.Set);
        this.registerAutocomplete('state', AutocompleteProviders.SetState);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.sets.activateStateFor(args.set.name, args.state.name, args.duration, args.unit);
    }
}

type Args = {
    readonly duration: number;
    readonly set: {
        readonly name: string;
    };
    readonly state: {
        readonly name: string;
    };
    readonly unit: ClockUnit;
};
