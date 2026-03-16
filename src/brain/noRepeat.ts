import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { SETTING_NO_REPEAT_WINDOWS } from '../const';
import type { ClockUnit, Feature, FlowBitsApp, NoRepeatWindow } from '../types';
import { convertDurationToMs } from '../util';

export default class NoRepeat extends Shortcuts<FlowBitsApp> implements Feature<NoRepeatWindow> {
    #windows: Record<string, DateTime> = {};

    async initialize(): Promise<void> {
        this.#windows = Object.fromEntries(
            Object.entries<string>(this.settings.get(SETTING_NO_REPEAT_WINDOWS) ?? {})
                .flatMap(([key, value]) => {
                    if (value === null) {
                        return [];
                    }

                    const timestamp = DateTime.fromISO(value);
                    return timestamp.isValid ? [[key, timestamp]] : [];
                })
        );
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up corrupted no-repeat windows...');

        const now = DateTime.now();
        let changed = false;

        for (const [name, timestamp] of Object.entries(this.#windows)) {
            if (!timestamp.isValid || timestamp > now) {
                this.log(`Deleting corrupted no-repeat window ${name}...`);
                delete this.#windows[name];
                changed = true;
            }
        }

        if (changed) {
            this.#persistWindows();
        }
    }

    async count(): Promise<number> {
        return Object.keys(this.#windows).length;
    }

    async find(name: string): Promise<NoRepeatWindow | null> {
        if (!Object.hasOwn(this.#windows, name)) {
            return null;
        }

        return {
            name,
            lastUpdate: this.#windows[name]?.toISO() ?? undefined
        };
    }

    async findAll(): Promise<NoRepeatWindow[]> {
        return Object.entries(this.#windows)
            .map(([name, lastUpdate]) => ({
                name,
                lastUpdate: lastUpdate?.toISO() ?? undefined
            }));
    }

    async clear(name: string): Promise<void> {
        delete this.#windows[name];
        this.#persistWindows();

        this.log(`Clear no-repeat window ${name}.`);
    }

    async check(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const last = this.#windows[name] ?? null;
        const now = DateTime.now();

        if (last === null) {
            this.#windows[name] = now;
            this.#persistWindows();
            this.log(`Set no-repeat window last call to ${now.toISO()}.`);
            return true;
        }

        const ms = convertDurationToMs(duration, unit);

        if (last.plus({milliseconds: ms}) <= now) {
            this.#windows[name] = now;
            this.#persistWindows();
            this.log(`Set no-repeat window last call to ${now.toISO()}.`);
            return true;
        }

        return false;
    }

    #persistWindows(): void {
        this.settings.set(SETTING_NO_REPEAT_WINDOWS, Object.fromEntries(
            Object.entries(this.#windows).flatMap(([key, dt]) => {
                const iso = dt.toISO();
                return iso ? [[key, iso]] : [];
            })
        ));
    }
}
