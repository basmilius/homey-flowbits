import { Shortcuts } from '@basmilius/homey-common';
import { REALTIME_COUNTER_UPDATE, SETTING_COUNTERS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { Counter, Feature, FlowBitsApp } from '../types';

export default class Counters extends Shortcuts<FlowBitsApp> implements Feature<Counter> {
    get values(): Record<string, number> {
        return this.settings.get(SETTING_COUNTERS) ?? {};
    }

    set values(value: Record<string, number>) {
        this.settings.set(SETTING_COUNTERS, value);
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused counters...');

        const defined = await this.findAll();
        const keys = Object.keys(this.values);
        const values = this.values;

        for (const key of keys) {
            if (defined.some(counter => counter.name === key)) {
                continue;
            }

            this.log(`Deleting unused counter ${key}...`);
            delete values[key];
        }

        this.values = values;
    }

    async count(): Promise<number> {
        return Object.keys(this.values).length;
    }

    async find(name: string): Promise<Counter | null> {
        const counters = await this.findAll();
        const counter = counters.find(counter => counter.name === name);

        return counter ?? null;
    }

    async findAll(): Promise<Counter[]> {
        const provider = this.#autocompleteProvider();
        const counters = await provider.find('');

        if (counters.length === 0) {
            return [];
        }

        const results: Counter[] = [];

        for (const counter of counters) {
            const value = this.values[counter.name] ?? 0;

            results.push({
                name: counter.name,
                value
            });
        }

        return results;
    }

    async getValue(name: string): Promise<number> {
        return this.values[name] ?? 0;
    }

    async setValue(name: string, value: number): Promise<void> {
        this.values = {
            ...this.values,
            [name]: value
        };

        this.log(`Set counter ${name} to ${value}.`);

        await Promise.allSettled([
            this.#triggerChanged(name, value),
            this.#triggerReaches(name, value),
            this.#triggerRealtime(name, value)
        ]);
    }

    async increment(name: string, amount: number = 1): Promise<void> {
        const current = this.values[name] ?? 0;
        await this.setValue(name, current + amount);
    }

    async decrement(name: string, amount: number = 1): Promise<void> {
        const current = this.values[name] ?? 0;
        await this.setValue(name, current - amount);
    }

    async reset(name: string): Promise<void> {
        await this.setValue(name, 0);
    }

    async #triggerChanged(counter: string, value: number): Promise<void> {
        this.registry
            .findTrigger(Triggers.CounterChanged)
            ?.trigger({counter}, {value});
    }

    async #triggerReaches(counter: string, value: number): Promise<void> {
        this.registry
            .findTrigger(Triggers.CounterReaches)
            ?.trigger({counter, value}, {counter, value});
    }

    async #triggerRealtime(counter: string, value: number): Promise<void> {
        this.realtime(REALTIME_COUNTER_UPDATE, {counter, value});
    }

    #autocompleteProvider(): AutocompleteProviders.Counter {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.Counter);

        if (!provider) {
            throw new Error('Failed to get the counter autocomplete provider.');
        }

        return provider;
    }
}
