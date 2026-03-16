import { Shortcuts } from '@basmilius/homey-common';
import { REALTIME_SLIDER_UPDATE, SETTING_SLIDERS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { Feature, FlowBitsApp, Slider } from '../types';

export default class Sliders extends Shortcuts<FlowBitsApp> implements Feature<Slider> {
    #values: Record<string, number> = {};

    async initialize(): Promise<void> {
        this.#values = this.settings.get(SETTING_SLIDERS) ?? {};
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused sliders...');

        const provider = this.#autocompleteProvider();
        const definedNames = new Set(provider.values);

        for (const key of Object.keys(this.#values)) {
            if (definedNames.has(key)) {
                continue;
            }

            this.log(`Deleting unused slider ${key}...`);
            delete this.#values[key];
        }

        this.settings.set(SETTING_SLIDERS, this.#values);
    }

    async count(): Promise<number> {
        return this.#autocompleteProvider().values.length;
    }

    async find(name: string): Promise<Slider | null> {
        const provider = this.#autocompleteProvider();

        if (!provider.values.includes(name)) {
            return null;
        }

        return {
            name,
            value: this.#values[name] ?? 0
        };
    }

    async findAll(): Promise<Slider[]> {
        const provider = this.#autocompleteProvider();
        const sliders = await provider.find('');

        if (sliders.length === 0) {
            return [];
        }

        return sliders.map(slider => ({
            name: slider.name,
            value: this.#values[slider.name] ?? 0
        }));
    }

    async getValue(name: string): Promise<number | null> {
        return this.#values[name] ?? null;
    }

    async setValue(name: string, value: number, widgetId?: string): Promise<void> {
        this.#values[name] = value;
        this.settings.set(SETTING_SLIDERS, this.#values);

        this.log(`Set value of slider ${name} to ${value}.`);

        await Promise.allSettled([
            this.#triggerRealtime(name, value, widgetId),
            this.#triggerChanged(name, value)
        ]);
    }

    async #triggerChanged(slider: string, value: number): Promise<void> {
        this.registry
            .findTrigger(Triggers.SliderChanged)
            ?.trigger({slider}, {value});
    }

    async #triggerRealtime(slider: string, value: number, widgetId?: string): Promise<void> {
        this.realtime(REALTIME_SLIDER_UPDATE, {slider, value, widgetId});
    }

    #autocompleteProvider(): AutocompleteProviders.Slider {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.Slider);

        if (!provider) {
            throw new Error('Failed to get the slider autocomplete provider.');
        }

        return provider;
    }
}
