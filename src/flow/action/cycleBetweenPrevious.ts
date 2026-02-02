import { action, FlowActionEntity } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../../types';
import { AutocompleteProviders } from '..';

@action('cycle_between_previous')
export default class extends FlowActionEntity<FlowBitsApp, Args> {
    async onInit(): Promise<void> {
        this.registerAutocomplete('name', AutocompleteProviders.Cycle);

        await super.onInit();
    }

    async onRun(args: Args): Promise<void> {
        await this.app.cycles.cyclePrevious(args.name.name, args.min_value, args.max_value);
    }
}

type Args = {
    readonly max_value: number;
    readonly min_value: number;
    readonly name: {
        readonly name: string;
    };
};
