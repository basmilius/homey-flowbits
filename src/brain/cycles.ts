import { Shortcuts } from '@basmilius/homey-common';
import { REALTIME_CYCLE_UPDATE, SETTING_CYCLE_PREFIX } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { Cycle, Feature, FlowBitsApp } from '../types';
import { slugify } from '../util';

export default class Cycles extends Shortcuts<FlowBitsApp> implements Feature<Cycle> {
    async cleanup(): Promise<void> {
        this.log('Cleaning up unused cycles...');

        const defined = await this.findAll();

        for (const key of this.settings.getKeys()) {
            if (!key.startsWith(SETTING_CYCLE_PREFIX) || defined.find(d => this.#id(d.name) === key)) {
                continue;
            }

            this.log(`Deleting unused cycle ${key}....`);
            this.settings.unset(key);
        }
    }

    async count(): Promise<number> {
        const cycles = await this.findAll();

        return cycles.length;
    }

    async find(name: string): Promise<Cycle | null> {
        const cycles = await this.findAll();
        const cycle = cycles.find(cycle => cycle.name === name);

        return cycle ?? null;
    }

    async findAll(): Promise<Cycle[]> {
        const provider = this.#autocompleteProvider();
        const cycles = await provider.find('');

        if (cycles.length === 0) {
            return [];
        }

        const results: Cycle[] = [];

        for (const cycle of cycles) {
            results.push({
                name: cycle.name,
                step: this.#get(cycle.name) ?? -1
            });
        }

        return results;
    }

    async cycle(name: string, minValue: number, maxValue: number): Promise<void> {
        if (minValue > maxValue) {
            [minValue, maxValue] = [maxValue, minValue];
        }

        let value = this.#get(name);

        if (value === null) {
            value = minValue;
        } else {
            value = Math.max(value, minValue);
            value++;

            if (value > maxValue) {
                value = minValue;
            }
        }

        await this.cycleTo(name, value);
    }

    async cyclePrevious(name: string, minValue: number, maxValue: number): Promise<void> {
        if (minValue > maxValue) {
            [minValue, maxValue] = [maxValue, minValue];
        }

        let value = this.#get(name);

        if (value === null) {
            value = maxValue;
        } else {
            value = Math.min(value, maxValue);
            value--;

            if (value < minValue) {
                value = maxValue;
            }
        }

        await this.cycleTo(name, value);
    }

    async cycleTo(name: string, value: number): Promise<void> {
        this.#set(name, value);

        this.log(`Cycle ${name} to ${value}.`);

        await Promise.allSettled([
            this.#triggerRealtime(name),
            this.#triggerCycleBecomes(name, value),
            this.#triggerCycleUpdates(name, value)
        ]);
    }

    async getValue(name: string): Promise<number | null> {
        return this.#get(name);
    }

    #id(name: string): string {
        return `${SETTING_CYCLE_PREFIX}${slugify(name)}`;
    }

    #get(name: string): number | null {
        return this.settings.get(this.#id(name));
    }

    #set(name: string, value: number): void {
        this.settings.set(this.#id(name), value);
    }

    async #triggerCycleBecomes(name: string, value: number): Promise<void> {
        this.registry
            .findTrigger(Triggers.CycleBecomes)
            ?.trigger({name, value});
    }

    async #triggerCycleUpdates(name: string, value: number): Promise<void> {
        this.registry
            .findTrigger(Triggers.CycleUpdates)
            ?.trigger({name}, {value});
    }

    async #triggerRealtime(name: string): Promise<void> {
        const cycle = await this.find(name);

        if (!cycle) {
            return;
        }

        this.realtime(REALTIME_CYCLE_UPDATE, cycle);
    }

    #autocompleteProvider(): AutocompleteProviders.Cycle {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.Cycle);

        if (!provider) {
            throw new Error('Failed to get the cycle autocomplete provider.');
        }

        return provider;
    }
}
