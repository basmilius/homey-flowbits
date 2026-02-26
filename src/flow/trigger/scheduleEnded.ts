import { FlowTriggerEntity, trigger } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@trigger('schedule_ended')
export default class extends FlowTriggerEntity<FlowBitsApp, Args, State> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('schedule', AutocompleteProviders.Schedule);

        await super.onInit();
    }

    async onRun(args: Args, state: State): Promise<boolean> {
        return args.schedule.name === state.name;
    }
}

type Args = {
    readonly schedule: {
        readonly name: string;
    };
};

type State = {
    readonly name: string;
};
