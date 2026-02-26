import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { REALTIME_SCHEDULE_UPDATE, SETTING_SCHEDULES } from '../const';
import { Triggers } from '../flow';
import type { Feature, FlowBitsApp, Schedule, ScheduleDays } from '../types';

type StoredSchedule = {
    readonly startTime: string;
    readonly endTime: string;
    readonly days: ScheduleDays;
};

export default class Schedules extends Shortcuts<FlowBitsApp> implements Feature<Schedule> {
    #transitionTimeouts: Map<string, NodeJS.Timeout> = new Map();

    get configs(): Record<string, StoredSchedule> {
        return this.settings.get(SETTING_SCHEDULES) ?? {};
    }

    set configs(value: Record<string, StoredSchedule>) {
        this.settings.set(SETTING_SCHEDULES, value);
    }

    async initialize(): Promise<void> {
        this.log('Initializing schedules...');

        for (const name of Object.keys(this.configs)) {
            this.#scheduleNextTransition(name);
        }
    }

    async cleanup(): Promise<void> {
        // Nothing to clean up — schedules persist until explicitly deleted
    }

    async count(): Promise<number> {
        return Object.keys(this.configs).length;
    }

    async find(name: string): Promise<Schedule | null> {
        const config = this.configs[name];

        if (!config) {
            return null;
        }

        return {
            name,
            active: this.#isCurrentlyActive(config),
            days: config.days,
            startTime: config.startTime,
            endTime: config.endTime
        };
    }

    async findAll(): Promise<Schedule[]> {
        return Object.entries(this.configs).map(([name, config]) => ({
            name,
            active: this.#isCurrentlyActive(config),
            days: config.days,
            startTime: config.startTime,
            endTime: config.endTime
        }));
    }

    async configure(name: string, startTime: string, endTime: string, days: ScheduleDays): Promise<void> {
        this.#clearTransitionTimeout(name);

        this.configs = {
            ...this.configs,
            [name]: {startTime, endTime, days}
        };

        this.log(`Configured schedule ${name}: ${days} ${startTime}–${endTime}.`);

        this.#scheduleNextTransition(name);

        await this.#triggerRealtime();
    }

    isActive(name: string): boolean {
        const config = this.configs[name];

        if (!config) {
            return false;
        }

        return this.#isCurrentlyActive(config);
    }

    #isCurrentlyActive(config: StoredSchedule): boolean {
        const now = DateTime.now();
        const [startH, startM] = config.startTime.split(':').map(Number);
        const [endH, endM] = config.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        const currentMinutes = now.hour * 60 + now.minute;

        if (startMinutes <= endMinutes) {
            // Normal window within a single day (e.g. 08:00–17:00)
            return this.#isScheduleDay(config.days, now.weekday)
                && currentMinutes >= startMinutes
                && currentMinutes < endMinutes;
        } else {
            // Overnight window spanning midnight (e.g. 22:00–07:00)
            const startedToday = this.#isScheduleDay(config.days, now.weekday) && currentMinutes >= startMinutes;
            const startedYesterday = this.#isScheduleDay(config.days, now.minus({days: 1}).weekday) && currentMinutes < endMinutes;

            return startedToday || startedYesterday;
        }
    }

    #isScheduleDay(days: ScheduleDays, weekday: number): boolean {
        // Luxon weekday: 1=Monday … 7=Sunday
        switch (days) {
            case 'every_day': return true;
            case 'weekdays': return weekday >= 1 && weekday <= 5;
            case 'weekends': return weekday === 6 || weekday === 7;
        }
    }

    #scheduleNextTransition(name: string): void {
        const config = this.configs[name];

        if (!config) {
            return;
        }

        const ms = this.#msUntilNextTransition(config);

        const timeout = this.setTimeout(async () => {
            this.#transitionTimeouts.delete(name);
            await this.#onTransition(name);
            this.#scheduleNextTransition(name);
        }, ms);

        this.#transitionTimeouts.set(name, timeout);
    }

    #msUntilNextTransition(config: StoredSchedule): number {
        const now = DateTime.now();
        const currently = this.#isCurrentlyActive(config);
        const [startH, startM] = config.startTime.split(':').map(Number);
        const [endH, endM] = config.endTime.split(':').map(Number);
        const isOvernight = (startH * 60 + startM) > (endH * 60 + endM);

        // Walk forward up to 8 days to find the next transition moment
        for (let offset = 0; offset <= 8; offset++) {
            const dayStart = now.plus({days: offset}).startOf('day');

            if (currently) {
                // Looking for next end time
                let candidate: DateTime;

                if (isOvernight) {
                    // End time falls on the day AFTER the window started; the window
                    // started on (dayStart - 1 day), so we check whether that prior day
                    // is a valid schedule day.
                    const priorDay = dayStart.minus({days: 1});

                    if (!this.#isScheduleDay(config.days, priorDay.weekday)) {
                        continue;
                    }

                    candidate = dayStart.set({hour: endH, minute: endM, second: 0, millisecond: 0});
                } else {
                    // End time is on the same schedule day as the start time
                    if (!this.#isScheduleDay(config.days, dayStart.weekday)) {
                        continue;
                    }

                    candidate = dayStart.set({hour: endH, minute: endM, second: 0, millisecond: 0});
                }

                if (candidate > now) {
                    return candidate.diff(now).milliseconds;
                }
            } else {
                // Looking for next start time on a valid schedule day
                if (!this.#isScheduleDay(config.days, dayStart.weekday)) {
                    continue;
                }

                const candidate = dayStart.set({hour: startH, minute: startM, second: 0, millisecond: 0});

                if (candidate > now) {
                    return candidate.diff(now).milliseconds;
                }
            }
        }

        // Fallback: reschedule in 24 hours (should not occur for well-formed schedules)
        return 24 * 60 * 60 * 1000;
    }

    #clearTransitionTimeout(name: string): void {
        const existing = this.#transitionTimeouts.get(name);

        if (existing) {
            this.clearTimeout(existing);
            this.#transitionTimeouts.delete(name);
        }
    }

    async #onTransition(name: string): Promise<void> {
        const config = this.configs[name];

        if (!config) {
            return;
        }

        if (this.#isCurrentlyActive(config)) {
            this.log(`Schedule ${name} started.`);
            await this.#triggerStarted(name);
        } else {
            this.log(`Schedule ${name} ended.`);
            await this.#triggerEnded(name);
        }

        await this.#triggerRealtime();
    }

    async #triggerStarted(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.ScheduleStarted)
            ?.trigger({name});
    }

    async #triggerEnded(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.ScheduleEnded)
            ?.trigger({name});
    }

    async #triggerRealtime(): Promise<void> {
        this.realtime(REALTIME_SCHEDULE_UPDATE);
    }
}
