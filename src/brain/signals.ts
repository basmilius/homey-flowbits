import { Shortcuts } from '@basmilius/homey-common';
import { AutocompleteProviders, Triggers } from '../flow';
import type { Feature, FlowBitsApp, Signal } from '../types';

export default class Signals extends Shortcuts<FlowBitsApp> implements Feature<Signal> {
    async cleanup(): Promise<void> {
    }

    async count(): Promise<number> {
        return this.#autocompleteProvider().values.length;
    }

    async find(name: string): Promise<Signal | null> {
        const provider = this.#autocompleteProvider();

        if (!provider.values.includes(name)) {
            return null;
        }

        return {name};
    }

    async findAll(): Promise<Signal[]> {
        return this.#autocompleteProvider().values.map(name => ({name}));
    }

    async send(signal: string, value?: string): Promise<void> {
        this.log(value ? `Sending signal ${signal} with value ${value}.` : `Sending signal ${signal}.`);

        await this.#triggerReceive(signal, value);
    }

    async #triggerReceive(signal: string, value: string = ''): Promise<void> {
        await this.registry
            .findTrigger(Triggers.SignalReceive)
            ?.trigger({signal}, {value});
    }

    #autocompleteProvider(): AutocompleteProviders.Signal {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.Signal);

        if (!provider) {
            throw new Error('Failed to get the signal autocomplete provider.');
        }

        return provider;
    }
}
