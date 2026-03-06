import { Shortcuts } from '@basmilius/homey-common';
import type { FlowBitsApp } from '../types';
import { Triggers } from '../flow';

// todo(Bas): Make signals a fully fledged Feature<>.

export default class Signals extends Shortcuts<FlowBitsApp> {
    async send(signal: string, value?: string): Promise<void> {
        this.log(value ? `Sending signal ${signal} with value ${value}.` : `Sending signal ${signal}.`);

        await this.#triggerReceive(signal, value);
    }

    async #triggerReceive(signal: string, value: string = ''): Promise<void> {
        await this.registry
            .findTrigger(Triggers.SignalReceive)
            ?.trigger({signal}, {value});
    }
}
