import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { EVENTS_HISTORY_LENGTH, REALTIME_EVENTS_UPDATE, SETTING_EVENT_LOOKS, SETTING_EVENTS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { ClockUnit, Event, Feature, FlowBitsApp, Look, Styleable } from '../types';
import { convertDurationToMs } from '../util';

export default class Events extends Shortcuts<FlowBitsApp> implements Feature<Event>, Styleable {
    #rawEvents: Record<string, string[]> = {};
    #looks: Record<string, Look> = {};

    async initialize(): Promise<void> {
        const legacyEvents = this.settings.get('events');

        if (legacyEvents && !this.settings.get(SETTING_EVENTS)) {
            this.settings.set(SETTING_EVENTS, legacyEvents);
            this.settings.unset('events');
            this.log('Migrated legacy events key.');
        }

        this.#rawEvents = this.settings.get(SETTING_EVENTS) ?? {};
        this.#looks = this.settings.get(SETTING_EVENT_LOOKS) ?? {};
    }

    get looks(): Record<string, Look> {
        return {...this.#looks};
    }

    set looks(value: Record<string, Look>) {
        this.#looks = value;
        this.settings.set(SETTING_EVENT_LOOKS, value);
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused events...');

        const provider = this.#autocompleteProvider();
        const definedNames = new Set(provider.values);
        const keys = new Set([
            ...Object.keys(this.#rawEvents),
            ...Object.keys(this.#looks)
        ]);

        for (const key of keys) {
            if (definedNames.has(key)) {
                continue;
            }

            this.log(`Deleting unused event ${key}...`);
            delete this.#rawEvents[key];
            delete this.#looks[key];
        }

        this.settings.set(SETTING_EVENTS, this.#rawEvents);
        this.settings.set(SETTING_EVENT_LOOKS, this.#looks);
    }

    async count(): Promise<number> {
        return this.#autocompleteProvider().values.length;
    }

    async find(name: string): Promise<Event | null> {
        const provider = this.#autocompleteProvider();

        if (!provider.values.includes(name)) {
            return null;
        }

        const look = this.getLook(name);
        const updates = this.#rawEvents[name] ?? [];

        return {
            color: look[0],
            icon: look[1],
            lastUpdate: updates[updates.length - 1] ?? undefined,
            name
        };
    }

    async findAll(): Promise<Event[]> {
        const provider = this.#autocompleteProvider();
        const events = await provider.find('');

        if (events.length === 0) {
            return [];
        }

        return events.map(event => {
            const look = this.getLook(event.name);
            const updates = this.#rawEvents[event.name] ?? [];

            return {
                color: look[0],
                icon: look[1],
                lastUpdate: updates[updates.length - 1] ?? undefined,
                name: event.name
            };
        });
    }

    async clear(name: string): Promise<void> {
        delete this.#rawEvents[name];
        this.settings.set(SETTING_EVENTS, this.#rawEvents);

        this.log(`Clear ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerCleared(name)
        ]);
    }

    async clearAll(): Promise<void> {
        const names = Object.keys(this.#rawEvents);
        this.#rawEvents = {};
        this.settings.set(SETTING_EVENTS, this.#rawEvents);

        this.log('Clear all events.');

        await this.#triggerRealtime();
        await Promise.allSettled(names.map(name => this.#triggerCleared(name)));
    }

    async happened(name: string): Promise<boolean> {
        return Object.hasOwn(this.#rawEvents, name);
    }

    async happenedTimesToday(name: string, times: number): Promise<boolean> {
        const rawEntries = this.#rawEvents[name] ?? [];
        const startOfDay = DateTime.now().startOf('day');

        return rawEntries.filter(v => DateTime.fromISO(v) >= startOfDay).length >= times;
    }

    async happenedTimesWithin(name: string, times: number, duration: number, unit: ClockUnit): Promise<boolean> {
        const rawEntries = this.#rawEvents[name] ?? [];
        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return rawEntries.filter(v => DateTime.fromISO(v) >= cutoff).length >= times;
    }

    async happenedToday(name: string): Promise<boolean> {
        const rawEntries = this.#rawEvents[name] ?? [];
        const startOfDay = DateTime.now().startOf('day');

        return rawEntries.some(v => DateTime.fromISO(v) >= startOfDay);
    }

    async happenedWithin(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const rawEntries = this.#rawEvents[name] ?? [];
        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return rawEntries.some(v => DateTime.fromISO(v) >= cutoff);
    }

    async trigger(name: string, value?: string): Promise<void> {
        const nowISO = DateTime.now().toISO();

        if (!nowISO) {
            return;
        }

        const history = this.#rawEvents[name] ?? [];
        history.push(nowISO);
        this.#rawEvents[name] = history.slice(-EVENTS_HISTORY_LENGTH);
        this.settings.set(SETTING_EVENTS, this.#rawEvents);

        this.log(value ? `Trigger ${name} at ${nowISO} with value ${value}.` : `Trigger ${name} at ${nowISO}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerTriggered(name, value)
        ]);
    }

    getLook(name: string): Look {
        return this.#looks[name] ?? ['#204ef6', '\ue237'];
    }

    async setLook(name: string, look: Look): Promise<void> {
        this.#looks[name] = look;
        this.settings.set(SETTING_EVENT_LOOKS, this.#looks);

        await this.#triggerRealtime();
    }

    async update(): Promise<void> {
        await this.#triggerRealtime();
    }

    async #triggerCleared(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.EventCleared)
            ?.trigger({name});
    }

    async #triggerTriggered(name: string, value: string = ''): Promise<void> {
        this.registry
            .findTrigger(Triggers.EventTriggered)
            ?.trigger({name}, {value});
    }

    async #triggerRealtime(): Promise<void> {
        this.realtime(REALTIME_EVENTS_UPDATE);
    }

    #autocompleteProvider(): AutocompleteProviders.Event {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.Event);

        if (!provider) {
            throw new Error('Failed to get the event autocomplete provider.');
        }

        return provider;
    }
}
