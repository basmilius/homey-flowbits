import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { MAX_TIMEOUT_MS, REALTIME_FLAGS_UPDATE, SETTING_FLAG_EXPIRES_AT, SETTING_FLAG_LAST_UPDATES, SETTING_FLAG_LOOKS, SETTING_FLAGS } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { ClockUnit, Feature, Flag, FlowBitsApp, Look, Styleable } from '../types';
import { convertDurationToMs, plainRecord, recordFromEntries } from '../util';

export default class Flags extends Shortcuts<FlowBitsApp> implements Feature<Flag>, Styleable {
    #expirationTimeout: NodeJS.Timeout | null = null;

    get currentFlags(): string[] {
        return this.settings.get(SETTING_FLAGS) ?? [];
    }

    set currentFlags(value: string[]) {
        this.settings.set(SETTING_FLAGS, value);
    }

    get looks(): Record<string, Look> {
        return plainRecord(this.settings.get(SETTING_FLAG_LOOKS));
    }

    set looks(value: Record<string, Look>) {
        this.settings.set(SETTING_FLAG_LOOKS, value);
    }

    get lastUpdates(): Record<string, DateTime> {
        return recordFromEntries(
            Object.entries<string>(this.settings.get(SETTING_FLAG_LAST_UPDATES) ?? {})
                .map(([key, value]) => [
                    key,
                    DateTime.fromISO(value)
                ])
        );
    }

    set lastUpdates(value: Record<string, DateTime>) {
        this.settings.set(SETTING_FLAG_LAST_UPDATES, Object.fromEntries(
            Object.entries(value)
                .map(([key, value]) => [
                    key,
                    value.toISO()
                ])
        ));
    }

    get expirations(): Record<string, DateTime> {
        return recordFromEntries(
            Object.entries<string>(this.settings.get(SETTING_FLAG_EXPIRES_AT) ?? {})
                .map(([key, value]) => [
                    key,
                    DateTime.fromISO(value)
                ])
        );
    }

    set expirations(value: Record<string, DateTime>) {
        this.settings.set(SETTING_FLAG_EXPIRES_AT, Object.fromEntries(
            Object.entries(value)
                .map(([key, value]) => [
                    key,
                    value.toISO()
                ])
        ));
    }

    async initialize(): Promise<void> {
        await this.#scheduleNextExpiration();
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused flags...');

        const defined = await this.findAll();
        const looks = this.looks;
        const lastUpdates = this.lastUpdates;
        const expirations = this.expirations;

        this.currentFlags = this.currentFlags.filter(flag => defined.find(d => d.name === flag));

        for (const key of Object.keys(this.looks)) {
            if (defined.find(d => d.name === key)) {
                continue;
            }

            this.log(`Deleting unused flag look ${key}...`);
            delete looks[key];
        }

        for (const key of Object.keys(this.lastUpdates)) {
            if (defined.find(d => d.name === key)) {
                continue;
            }

            this.log(`Deleting unused flag last update ${key}...`);
            delete lastUpdates[key];
        }

        for (const key of Object.keys(expirations)) {
            if (defined.find(d => d.name === key)) {
                continue;
            }

            this.log(`Deleting unused flag expiration ${key}...`);
            delete expirations[key];
        }

        this.looks = looks;
        this.lastUpdates = lastUpdates;
        this.expirations = expirations;

        await this.#scheduleNextExpiration();
    }

    async count(): Promise<number> {
        const flags = await this.findAll();

        return flags.length;
    }

    async find(name: string): Promise<Flag | null> {
        const flags = await this.findAll();
        const flag = flags.find(flag => flag.name === name);

        return flag ?? null;
    }

    async findAll(): Promise<Flag[]> {
        const provider = this.#autocompleteProvider();
        const current = this.currentFlags;
        const lastUpdates = this.lastUpdates;
        const flags = await provider.find('');

        return flags.map(flag => {
            const look = this.getLook(flag.name);
            const lastUpdate = lastUpdates[flag.name];

            return {
                active: current.includes(flag.name),
                color: look[0],
                icon: look[1],
                lastUpdate: lastUpdate?.toISO() ?? undefined,
                name: flag.name
            };
        });
    }

    async activate(name: string): Promise<void> {
        const current = this.currentFlags;

        if (!name) {
            return;
        }

        // An open-ended activation cancels any scheduled deactivation for this flag.
        const clearedExpiration = this.#clearExpiration(name);

        if (current.includes(name)) {
            if (clearedExpiration) {
                await this.#scheduleNextExpiration();
            }

            return;
        }

        this.currentFlags = [...current, name];
        this.lastUpdates = {
            ...this.lastUpdates,
            [name]: DateTime.now()
        };

        this.log(`Activate flag ${name}.`);

        await this.#scheduleNextExpiration();

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerActivated(name),
            this.#triggerChanged(name, true)
        ]);
    }

    async deactivate(name: string): Promise<void> {
        const current = this.currentFlags;

        if (!name || !current.includes(name)) {
            // Drop a lingering expiration even when the flag is already inactive.
            if (this.#clearExpiration(name)) {
                await this.#scheduleNextExpiration();
            }

            return;
        }

        this.#clearExpiration(name);

        this.currentFlags = current.filter(f => f !== name);
        this.lastUpdates = {
            ...this.lastUpdates,
            [name]: DateTime.now()
        };

        this.log(`Deactivate flag ${name}.`);

        await this.#scheduleNextExpiration();

        await Promise.allSettled([
            this.#triggerRealtime(),
            this.#triggerDeactivated(name),
            this.#triggerChanged(name, false)
        ]);
    }

    async toggle(name: string): Promise<void> {
        if (this.currentFlags.includes(name)) {
            await this.deactivate(name);
        } else {
            await this.activate(name);
        }
    }

    async activateFor(name: string, duration: number, unit: ClockUnit): Promise<void> {
        if (!name) {
            return;
        }

        const expiresAt = DateTime.now().plus({milliseconds: convertDurationToMs(duration, unit)});

        await this.#activateWithExpiration(name, expiresAt);

        this.log(`Activated flag ${name} for ${duration} ${unit}.`);
    }

    async activateUntil(name: string, expiresAt: DateTime): Promise<void> {
        if (!name) {
            return;
        }

        if (expiresAt <= DateTime.now()) {
            this.log(`Skipped activating flag ${name} until ${expiresAt.toISO()} because that moment is in the past.`);
            return;
        }

        await this.#activateWithExpiration(name, expiresAt);

        this.log(`Activated flag ${name} until ${expiresAt.toISO()}.`);
    }

    async isActiveFor(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.lastUpdates[name];

        if (!lastUpdate) {
            return false;
        }

        const isActive = this.currentFlags.includes(name);

        if (!isActive) {
            return false;
        }

        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return lastUpdate <= cutoff;
    }

    async isInactiveFor(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const lastUpdate = this.lastUpdates[name];

        if (!lastUpdate) {
            // If there's no lastUpdate, the flag has never been touched, so consider it inactive forever
            return true;
        }

        const isActive = this.currentFlags.includes(name);

        if (isActive) {
            return false;
        }

        const ms = convertDurationToMs(duration, unit);
        const cutoff = DateTime.now().minus({milliseconds: ms});

        return lastUpdate <= cutoff;
    }

    getLook(name: string): Look {
        return this.looks[name] ?? ['#204ef6', ''];
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

    async #activateWithExpiration(name: string, expiresAt: DateTime): Promise<void> {
        const current = this.currentFlags;
        const wasActive = current.includes(name);

        if (!wasActive) {
            this.currentFlags = [...current, name];
            this.lastUpdates = {
                ...this.lastUpdates,
                [name]: DateTime.now()
            };
        }

        this.expirations = {
            ...this.expirations,
            [name]: expiresAt
        };

        await this.#scheduleNextExpiration();

        if (!wasActive) {
            await Promise.allSettled([
                this.#triggerRealtime(),
                this.#triggerActivated(name),
                this.#triggerChanged(name, true)
            ]);
        } else {
            await this.#triggerRealtime();
        }
    }

    #clearExpiration(name: string): boolean {
        const expirations = this.expirations;

        if (!(name in expirations)) {
            return false;
        }

        delete expirations[name];
        this.expirations = expirations;

        return true;
    }

    async #scheduleNextExpiration(): Promise<void> {
        if (this.#expirationTimeout) {
            this.clearTimeout(this.#expirationTimeout);
            this.#expirationTimeout = null;
        }

        const now = DateTime.now();
        const current = this.currentFlags;
        let earliest: { name: string; expiresAt: DateTime } | null = null;

        for (const [name, expiresAt] of Object.entries(this.expirations)) {
            // Ignore expirations for flags that are no longer active.
            if (!current.includes(name)) {
                continue;
            }

            if (!earliest || expiresAt < earliest.expiresAt) {
                earliest = {name, expiresAt};
            }
        }

        if (!earliest) {
            return;
        }

        const diff = earliest.expiresAt.diff(now).as('milliseconds');

        if (diff <= 0) {
            await this.#processExpirations();
            return;
        }

        const delay = Math.min(diff, MAX_TIMEOUT_MS);

        this.#expirationTimeout = this.setTimeout(async () => {
            this.#expirationTimeout = null;
            await this.#processExpirations();
        }, delay);

        this.log(`Scheduled next flag expiration check in ${Math.round(delay / 1000)}s.`);
    }

    async #processExpirations(): Promise<void> {
        const now = DateTime.now();
        const expired: string[] = [];

        for (const [name, expiresAt] of Object.entries(this.expirations)) {
            if (expiresAt <= now) {
                expired.push(name);
            }
        }

        // Each deactivate() drops its expiration and reschedules; when nothing expired
        // (e.g. the timeout was capped by MAX_TIMEOUT_MS) reschedule for the remainder.
        await Promise.allSettled(expired.map(name => this.deactivate(name)));

        if (expired.length === 0) {
            await this.#scheduleNextExpiration();
        }
    }

    async #triggerActivated(name: string): Promise<void> {
        await this.registry.fireTrigger(Triggers.FlagActivated, {name});
    }

    async #triggerChanged(name: string, active: boolean): Promise<void> {
        await this.registry.fireTrigger(Triggers.FlagChanged, {name}, {active});
    }

    async #triggerDeactivated(name: string): Promise<void> {
        await this.registry.fireTrigger(Triggers.FlagDeactivated, {name});
    }

    async #triggerRealtime(): Promise<void> {
        this.realtime(REALTIME_FLAGS_UPDATE);
    }

    #autocompleteProvider(): AutocompleteProviders.Flag {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.Flag);

        if (!provider) {
            throw new Error('Failed to get the flag autocomplete provider.');
        }

        return provider;
    }
}
