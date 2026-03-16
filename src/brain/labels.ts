import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { REALTIME_LABELS_UPDATE, SETTING_LABEL_LOOKS, SETTING_LABELS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { Feature, FlowBitsApp, Label, Look, Styleable } from '../types';

export default class Labels extends Shortcuts<FlowBitsApp> implements Feature<Label>, Styleable {
    #labels: Record<string, [string, DateTime]> = {};
    #looks: Record<string, Look> = {};

    async initialize(): Promise<void> {
        this.#labels = Object.fromEntries(
            Object.entries<unknown>(this.settings.get(SETTING_LABELS) ?? {})
                .flatMap(([key, entry]) => {
                    if (!Array.isArray(entry) || entry.length < 2 || typeof entry[0] !== 'string' || typeof entry[1] !== 'string') {
                        return [];
                    }

                    const dt = DateTime.fromISO(entry[1]);
                    return dt.isValid ? [[key, [entry[0], dt]]] : [];
                })
        );
        this.#looks = this.settings.get(SETTING_LABEL_LOOKS) ?? {};
    }

    get looks(): Record<string, Look> {
        return {...this.#looks};
    }

    set looks(value: Record<string, Look>) {
        this.#looks = value;
        this.settings.set(SETTING_LABEL_LOOKS, value);
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused labels...');

        const provider = this.#autocompleteProvider();
        const definedNames = new Set(provider.values);
        const keys = new Set([
            ...Object.keys(this.#labels),
            ...Object.keys(this.#looks)
        ]);

        for (const key of keys) {
            if (definedNames.has(key)) {
                continue;
            }

            this.log(`Deleting unused label ${key}...`);
            delete this.#labels[key];
            delete this.#looks[key];
        }

        this.#persistLabels();
        this.settings.set(SETTING_LABEL_LOOKS, this.#looks);
    }

    async count(): Promise<number> {
        return this.#autocompleteProvider().values.length;
    }

    async find(name: string): Promise<Label | null> {
        const provider = this.#autocompleteProvider();

        if (!provider.values.includes(name)) {
            return null;
        }

        const look = this.getLook(name);
        const data = this.#labels[name] ?? null;

        return {
            color: look[0],
            icon: look[1],
            lastUpdate: data?.[1]?.toISO() ?? undefined,
            name,
            value: data?.[0]
        };
    }

    async findAll(): Promise<Label[]> {
        const provider = this.#autocompleteProvider();
        const labels = await provider.find('');

        if (labels.length === 0) {
            return [];
        }

        return labels.map(label => {
            const look = this.getLook(label.name);
            const data = this.#labels[label.name] ?? null;

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
        delete this.#labels[name];
        this.#persistLabels();

        this.log(`Clear label value for ${name}.`);

        await Promise.allSettled([
            this.#triggerChanged(name, '-'),
            this.#triggerCleared(name),
            this.#triggerRealtime()
        ]);
    }

    async getValue(name: string): Promise<string | null> {
        return this.#labels[name]?.[0] ?? null;
    }

    async hasValue(name: string, value: string): Promise<boolean> {
        return name in this.#labels && this.#labels[name]?.[0] === value;
    }

    async setValue(name: string, value: string): Promise<void> {
        this.#labels[name] = [value, DateTime.now()];
        this.#persistLabels();

        this.log(`Set label value for ${name} to ${value}.`);

        await Promise.allSettled([
            this.#triggerBecomes(name, value),
            this.#triggerChanged(name, value),
            this.#triggerChangedV2(name, value),
            this.#triggerRealtime()
        ]);
    }

    getLook(name: string): Look {
        return this.#looks[name] ?? ['#204ef6', '\uf02b'];
    }

    async setLook(name: string, look: Look): Promise<void> {
        this.#looks[name] = look;
        this.settings.set(SETTING_LABEL_LOOKS, this.#looks);

        await this.#triggerRealtime();
    }

    async update(): Promise<void> {
        await this.#triggerRealtime();
    }

    #persistLabels(): void {
        this.settings.set(SETTING_LABELS, Object.fromEntries(
            Object.entries(this.#labels).flatMap(([key, [value, dt]]) => {
                const iso = dt.toISO();
                return iso ? [[key, [value, iso]]] : [];
            })
        ));
    }

    async #triggerBecomes(name: string, value: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.LabelBecomes)
            ?.trigger({name, value});
    }

    async #triggerChanged(name: string, value: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.LabelChanged)
            ?.trigger({name}, {value});
    }

    async #triggerChangedV2(name: string, value: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.LabelChangedV2)
            ?.trigger({name}, {value});
    }

    async #triggerCleared(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.LabelCleared)
            ?.trigger({name});
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
