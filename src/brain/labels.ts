import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { REALTIME_LABELS_UPDATE, SETTING_LABEL_LOOKS, SETTING_LABELS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { Feature, FlowBitsApp, Label, Look, Styleable } from '../types';

export default class Labels extends Shortcuts<FlowBitsApp> implements Feature<Label>, Styleable {
    get labels(): Record<string, [string, DateTime]> {
        return Object.fromEntries(
            Object.entries<[string, string]>(this.settings.get(SETTING_LABELS) ?? {})
                .map(([key, [value, lastUpdate]]) => [
                    key,
                    [value, DateTime.fromISO(lastUpdate)]
                ])
        );
    }

    set labels(value: Record<string, [string, DateTime]>) {
        this.settings.set(SETTING_LABELS, Object.fromEntries(
            Object.entries(value)
                .map(([key, [value, lastUpdate]]) => [
                    key,
                    [value, lastUpdate.toISO()]
                ])
        ));
    }

    get looks(): Record<string, Look> {
        return this.settings.get(SETTING_LABEL_LOOKS) ?? {};
    }

    set looks(value: Record<string, Look>) {
        this.settings.set(SETTING_LABEL_LOOKS, value);
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused labels...');

        const defined = await this.findAll();
        const keys = new Set([
            ...Object.keys(this.labels),
            ...Object.keys(this.looks)
        ]);

        const labels = this.labels;
        const looks = this.looks;

        for (const key of keys) {
            if (defined.find(d => d.name === key)) {
                continue;
            }

            this.log(`Deleting unused label ${key}...`);
            delete labels[key];
            delete looks[key];
        }

        this.labels = labels;
        this.looks = looks;
    }

    async count(): Promise<number> {
        const labels = await this.findAll();

        return labels.length;
    }

    async find(name: string): Promise<Label | null> {
        const labels = await this.findAll();
        const label = labels.find(label => label.name === name);

        return label ?? null;
    }

    async findAll(): Promise<Label[]> {
        const provider = this.#autocompleteProvider();
        const labels = await provider.find('');

        if (labels.length === 0) {
            return [];
        }

        return labels.map(label => {
            const look = this.getLook(label.name);
            const data = this.labels[label.name] ?? null;

            return {
                color: look[0],
                icon: look[1],
                lastUpdate: data?.[1]?.toISO() ?? undefined,
                name: label.name,
                value: data?.[0]
            };
        });
    }

    async clearValue(name: string): Promise<void> {
        const labels = this.labels;
        delete labels[name];
        this.labels = labels;

        this.log(`Clear label value for ${name}.`);

        await Promise.allSettled([
            this.#triggerChanged(name, '-'),
            this.#triggerCleared(name),
            this.#triggerRealtime()
        ]);
    }

    async getValue(name: string): Promise<string | null> {
        return this.labels[name]?.[0] ?? null;
    }

    async hasValue(name: string, value: string): Promise<boolean> {
        return name in this.labels && this.labels[name]?.[0] === value;
    }

    async setValue(name: string, value: string): Promise<void> {
        this.labels = {
            ...this.labels,
            [name]: [value, DateTime.now()]
        };

        this.log(`Set label value for ${name} to ${value}.`);

        await Promise.allSettled([
            this.#triggerBecomes(name, value),
            this.#triggerChanged(name, value),
            this.#triggerChangedV2(name, value),
            this.#triggerRealtime()
        ]);
    }

    getLook(name: string): Look {
        return this.looks[name] ?? ['#204ef6', ''];
    }

    async setLook(name: string, look: Look): Promise<void> {
        this.looks = {
            ...this.looks,
            [name]: look
        };

        await this.#triggerRealtime();
    }

    async update(): Promise<void> {
        await this.#triggerRealtime();
    }

    async #triggerBecomes(name: string, value: string): Promise<void> {
        await this.registry.fireTrigger(Triggers.LabelBecomes, {name, value});
    }

    async #triggerChanged(name: string, value: string): Promise<void> {
        await this.registry.fireTrigger(Triggers.LabelChanged, {name}, {value});
    }

    async #triggerChangedV2(name: string, value: string): Promise<void> {
        await this.registry.fireTrigger(Triggers.LabelChangedV2, {name}, {value});
    }

    async #triggerCleared(name: string): Promise<void> {
        await this.registry.fireTrigger(Triggers.LabelCleared, {name});
    }

    async #triggerRealtime(): Promise<void> {
        this.realtime(REALTIME_LABELS_UPDATE);
    }

    #autocompleteProvider(): AutocompleteProviders.Label {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.Label);

        if (!provider) {
            throw new Error('Failed to get the label autocomplete provider.');
        }

        return provider;
    }
}
