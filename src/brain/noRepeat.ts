import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { SETTING_NO_REPEAT_WINDOWS } from '../const';
import type { ClockUnit, Feature, FlowBitsApp, NoRepeatWindow } from '../types';
import { convertDurationToMs } from '../util';

// todo(Bas): Implement cleanup().
// todo(Bas): Use auto complete provider to find defined no-repeat windows.

export default class NoRepeat extends Shortcuts<FlowBitsApp> implements Feature<NoRepeatWindow> {
    get windows(): Record<string, DateTime> {
        return Object.fromEntries(
            Object.entries<string>(this.settings.get(SETTING_NO_REPEAT_WINDOWS) ?? {})
                .filter(([, value]) => value !== null)
                .map(([key, value]) => [key, DateTime.fromISO(value)])
        );
    }

    set windows(value: Record<string, DateTime>) {
        this.settings.set(
            SETTING_NO_REPEAT_WINDOWS,
            Object.fromEntries(
                Object.entries(value)
                    .filter(([, value]) => value !== null)
                    .map(([key, value]) => [key, value.toISO()])
            )
        );
    }

    async cleanup(): Promise<void> {
    }

    async count(): Promise<number> {
        return Object.keys(this.windows).length;
    }

    async find(name: string): Promise<NoRepeatWindow | null> {
        const noRepeatWindows = await this.findAll();
        const noRepeatWindow = noRepeatWindows.find(noRepeatWindow => noRepeatWindow.name === name);

        return noRepeatWindow ?? null;
    }

    async findAll(): Promise<NoRepeatWindow[]> {
        return Object.entries(this.windows)
            .map(([name, lastUpdate]) => ({
                name,
                lastUpdate: lastUpdate?.toISO() ?? undefined
            }));
    }

    async clear(name: string): Promise<void> {
        const windows = this.windows;
        delete windows[name];
        this.windows = windows;

        this.log(`Clear no-repeat window ${name}.`);
    }

    async check(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const windows = this.windows;

        const now = DateTime.now();
        const last = windows[name] ?? null;
        windows[name] = now;

        this.windows = windows;

        this.log(`Set no-repeat window last call to ${now.toISO()}.`);

        if (last === null) {
            return true;
        }

        const ms = convertDurationToMs(duration, unit);

        return last.plus({milliseconds: ms}) <= now;
    }
}
