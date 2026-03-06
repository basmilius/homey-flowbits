import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { EVENTS_HISTORY_LENGTH, REALTIME_EVENTS_UPDATE, SETTING_EVENT_LOOKS, SETTING_EVENTS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { ClockUnit, Event, Feature, FlowBitsApp, Look, Styleable } from '../types';
import { convertDurationToMs } from '../util';

export default class Events extends Shortcuts<FlowBitsApp> implements Feature<Event>, Styleable {
    get events(): Record<string, DateTime[]> {
        return Object.fromEntries(
            Object.entries<string[]>(this.settings.get(SETTING_EVENTS) ?? this.settings.get('events') ?? {})
                .map(([key, value]) => [
                    key,
                    value.map(v => DateTime.fromISO(v))
                ])
        );
    }

    set events(value: Record<string, DateTime[]>) {
        this.settings.set(SETTING_EVENTS, Object.fromEntries(
            Object.entries<DateTime[]>(value)
                .map(([key, value]) => [
                    key,
                    value.map(v => v.toISO())
                ])
        ));
    }

    get looks(): Record<string, Look> {
        return this.settings.get(SETTING_EVENT_LOOKS) ?? {};
    }

    set looks(value: Record<string, Look>) {
        this.settings.set(SETTING_EVENT_LOOKS, value);
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused events...');

        const defined = await this.findAll();
        const keys = new Set([
            ...Object.keys(this.events),
            ...Object.keys(this.looks)
        ]);

        const events = this.events;
        const looks = this.looks;

        for (const key of keys) {
            if (defined.find(d => d.name === key)) {
                continue;
            }

            this.log(`Deleting unused event ${key}...`);
            delete events[key];
            delete looks[key];
        }

        this.events = events;
        this.looks = looks;
    }

    async count(): Promise<number> {
        const events = await this.findAll();

        return events.length;
    }

    async find(name: string): Promise<Event | null> {
        const events = await this.findAll();
        const event = events.find(event => event.name === name);

        return event ?? null;
    }

    async findAll(): Promise<Event[]> {
        const provider = this.#autocompleteProvider();
        const events = await provider.find('');

        if (events.length === 0) {
            return [];
        }

        const results: Event[] = [];

        for (const event of events) {
            const look = await this.getLook(event.name);
            const updates = this.events[event.name] ?? [];

            results.push({
                color: look[0],
                icon: look[1],
                lastUpdate: updates[updates.length - 1]?.toISO() ?? undefined,
                name: event.name
            });
        }

        return results;
    }

    async clear(name: string): Promise<void> {
        const events = this.events;
        delete events[name];

        this.events = events;

        this.log(`Clear ${name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerCleared(name)
        ]);
    }

    async clearAll(): Promise<void> {
        const names = Object.keys(this.events);
        this.events = {};

        this.log('Clear all events.');

        await this.#triggerRealtime();
        await Promise.allSettled(names.map(name => this.#triggerCleared(name)));
    }

    async happened(name: string): Promise<boolean> {
        return name in this.events;
    }

    async happenedTimesToday(name: string, times: number): Promise<boolean> {
        const events = this.events[name] ?? [];
        const startOfDay = DateTime.now().startOf('day');

        return events.filter(event => event >= startOfDay).length >= times;
    }

    async happenedTimesWithin(name: string, times: number, duration: number, unit: ClockUnit): Promise<boolean> {
        const events = this.events[name] ?? [];
        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return events.filter(event => event >= cutoff).length >= times;
    }

    async happenedToday(name: string): Promise<boolean> {
        const events = this.events[name] ?? [];
        const startOfDay = DateTime.now().startOf('day');

        return events.some(event => event >= startOfDay);
    }

    async happenedWithin(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const events = this.events[name] ?? [];
        const ms = convertDurationToMs(duration, unit);

        return events.some(event => Math.abs(event.diffNow().as('milliseconds')) <= ms);
    }

    async trigger(name: string, value?: string): Promise<void> {
        const events = this.events;
        const now = DateTime.now();
        events[name] = events[name]?.slice(-EVENTS_HISTORY_LENGTH) ?? [];
        events[name].push(now);

        this.events = events;

        this.log(value ? `Trigger ${name} at ${now.toISO()} with value ${value}.` : `Trigger ${name} at ${now.toISO()}.`);

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerTriggered(name, value)
        ]);
    }

    async getLook(name: string): Promise<Look> {
        return this.looks[name] ?? ['#204ef6', ''];
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
