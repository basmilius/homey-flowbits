import { Shortcuts } from '@basmilius/homey-common';
import { REALTIME_SLIDER_UPDATE, SETTING_SLIDERS, SETTING_SLIDER_LOOKS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { Feature, FlowBitsApp, Look, Slider, Styleable } from '../types';

export default class Sliders extends Shortcuts<FlowBitsApp> implements Feature<Slider>, Styleable {
    get values(): Record<string, number> {
        return this.settings.get(SETTING_SLIDERS) ?? {};
    }

    set values(value: Record<string, number>) {
        this.settings.set(SETTING_SLIDERS, value);
    }

    get looks(): Record<string, Look> {
        return this.settings.get(SETTING_SLIDER_LOOKS) ?? {};
    }

    set looks(value: Record<string, Look>) {
        this.settings.set(SETTING_SLIDER_LOOKS, value);
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused sliders...');

        const defined = await this.findAll();
        const keys = Object.keys(this.values);
        const values = this.values;
        const looks = this.looks;

        for (const key of keys) {
            if (defined.some(slider => slider.name === key)) {
                continue;
            }

            this.log(`Deleting unused slider ${key}...`);
            delete values[key];
        }

        for (const key of Object.keys(this.looks)) {
            if (defined.find(slider => slider.name === key)) {
                continue;
            }

            this.log(`Deleting unused slider look ${key}...`);
            delete looks[key];
        }

        this.values = values;
        this.looks = looks;
    }

    async count(): Promise<number> {
        return Object.keys(this.values).length;
    }

    async find(name: string): Promise<Slider | null> {
        const sliders = await this.findAll();
        const slider = sliders.find(slider => slider.name === name);

        return slider ?? null;
    }

    async findAll(): Promise<Slider[]> {
        const provider = this.#autocompleteProvider();
        const sliders = await provider.find('');

        if (sliders.length === 0) {
            return [];
        }

        const results: Slider[] = [];

        for (const slider of sliders) {
            const value = this.values[slider.name] ?? 0;
            const look = await this.getLook(slider.name);

            results.push({
                name: slider.name,
                value,
                color: look[0],
                icon: look[1]
            });
        }

        return results;
    }

    async getValue(name: string): Promise<number | null> {
        return this.values[name] ?? null;
    }

    async setValue(name: string, value: number, widgetId?: string): Promise<void> {
        this.values = {
            ...this.values,
            [name]: value
        };

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

    async getLook(name: string): Promise<Look> {
        return this.looks[name] ?? ['#204ef6', '\uf1de'];
    }

    async setLook(name: string, look: Look): Promise<void> {
        this.looks = {
            ...this.looks,
            [name]: look
        };

        await this.#triggerRealtime(name, this.values[name] ?? 0);
    }

    #autocompleteProvider(): AutocompleteProviders.Slider {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.Slider);

        if (!provider) {
            throw new Error('Failed to get the slider autocomplete provider.');
        }

        return provider;
    }
}
