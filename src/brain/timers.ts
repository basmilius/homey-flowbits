import { DateTime, Shortcuts } from '@basmilius/homey-common';
import { REALTIME_TIMER_UPDATE, SETTING_TIMER_LOOKS, SETTING_TIMER_PREFIX } from '../const';
import { AutocompleteProviders, Triggers } from '../flow';
import type { ClockState, ClockUnit, Feature, FlowBitsApp, Look, Styleable, Timer } from '../types';
import { convertDurationToSeconds, slugify } from '../util';

const TIMER_FINISH_GRACE_PERIOD = 5;

export default class Timers extends Shortcuts<FlowBitsApp> implements Feature<Timer>, Styleable {
    get looks(): Record<string, Look> {
        return this.settings.get(SETTING_TIMER_LOOKS) ?? {};
    }

    set looks(value: Record<string, Look>) {
        this.settings.set(SETTING_TIMER_LOOKS, value);
    }

    #timeouts: Record<string, NodeJS.Timeout[]> = {};
    #timers: Record<string, StoredTimer> = {};

    async initialize(): Promise<void> {
        await this.#schedule();
    }

    async cleanup(): Promise<void> {
        this.log('Cleaning up unused timers...');

        const defined = await this.findAll();
        const keys = Object.keys(this.looks);
        const looks = this.looks;

        for (const key of keys) {
            if (defined.find(d => d.name === key)) {
                continue;
            }

            this.log(`Deleting unused timer look ${key}...`);
            delete looks[key];
        }

        this.looks = looks;
    }

    async count(): Promise<number> {
        const timers = await this.findAll();

        return timers.length;
    }

    async find(name: string): Promise<Timer | null> {
        const timers = await this.findAll();
        const timer = timers.find(timer => timer.name === name);

        if (timer) {
            return timer;
        }

        const provider = this.#autocompleteProvider();
        const definedTimers = await provider.find('');
        const defined = definedTimers.find(t => t.name === name);

        if (defined) {
            const look = await this.getLook(name);

            return {
                color: look[0],
                icon: look[1],
                name,
                remaining: 0,
                status: 'stopped',
                target: 0
            };
        }

        return null;
    }

    async findAll(): Promise<Timer[]> {
        const now = DateTime.now().toSeconds();
        const provider = this.#autocompleteProvider();
        const definedTimers = await provider.find('');
        const activeTimers = await this.#findAll();
        const results: Timer[] = [];

        for (const timer of definedTimers) {
            const activeTimer = activeTimers.find(t => t.name === timer.name);
            const look = await this.getLook(timer.name);
            const remaining = activeTimer?.status === 'running'
                ? Math.max(0, activeTimer.target - now)
                : activeTimer?.remaining ?? 0;

            results.push({
                color: look[0],
                icon: look[1],
                name: timer.name,
                remaining,
                status: activeTimer?.status ?? 'stopped',
                target: activeTimer?.target ?? 0
            });
        }

        return results;
    }

    async finish(timer: StoredTimer): Promise<void> {
        this.#update(timer.name, timer.duration, 0, timer.target, 'finished');
        this.log(`Finish timer ${timer.name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(timer.name),
            this.#triggerFinished(timer.name)
        ]);
    }

    async pause(name: string): Promise<void> {
        const timer = this.#find(name);

        if (!timer) {
            return;
        }

        const now = DateTime.now();
        const target = DateTime.fromSeconds(timer.target);

        this.#update(timer.name, timer.duration, target.diff(now).as('seconds'), timer.target, 'paused');
        this.log(`Pause timer ${timer.name}.`);

        await this.#schedule();
        await Promise.allSettled([
            this.#triggerRealtime(timer.name),
            this.#triggerPaused(timer.name)
        ]);
    }

    async resume(name: string): Promise<void> {
        const timer = this.#find(name);

        if (!timer) {
            return;
        }

        const now = DateTime.now();
        const target = now.plus({seconds: timer.remaining});

        this.#update(timer.name, timer.duration, timer.remaining, target.toSeconds(), 'running');
        this.log(`Resume timer ${timer.name}.`);

        await this.#schedule();
        await Promise.allSettled([
            this.#triggerRealtime(timer.name),
            this.#triggerResumed(timer.name)
        ]);
    }

    async set(name: string, duration: number, unit: ClockUnit): Promise<void> {
        const timer = this.#find(name);

        if (!timer) {
            return;
        }

        this.#save(name, duration, unit, timer.status);
        await this.#schedule();

        this.log(`Set timer ${timer.name} to ${duration} ${unit}.`);
    }

    async start(name: string, duration: number, unit: ClockUnit): Promise<void> {
        this.#save(name, duration, unit, 'running');
        await this.#schedule();

        this.log(`Start timer ${name} for ${duration} ${unit}.`);

        await Promise.allSettled([
            this.#triggerRealtime(name),
            this.#triggerStarted(name)
        ]);
    }

    async stop(name: string): Promise<void> {
        const timer = this.#find(name);

        if (!timer) {
            return;
        }

        this.#clear(timer);
        this.#remove(timer.id);

        this.log(`Stop timer ${timer.name}.`);

        await Promise.allSettled([
            this.#triggerRealtime(timer.name),
            this.#triggerStopped(timer.name)
        ]);
    }

    async isDuration(name: string, duration: number, unit: ClockUnit): Promise<boolean> {
        const timer = this.#find(name);

        if (!timer) {
            return false;
        }

        const checkDuration = convertDurationToSeconds(duration, unit);
        const now = DateTime.now().toSeconds();

        return timer.target - now > checkDuration;
    }

    async isFinished(name: string): Promise<boolean> {
        const timer = this.#find(name);

        return timer?.status === 'finished';
    }

    async isPaused(name: string): Promise<boolean> {
        const timer = this.#find(name);

        return timer?.status === 'paused';
    }

    async isRunning(name: string): Promise<boolean> {
        const timer = this.#find(name);

        return timer?.status === 'running';
    }

    async getLook(name: string): Promise<Look> {
        return this.looks[name] ?? ['#06b6d4', ''];
    }

    async setLook(name: string, look: Look): Promise<void> {
        this.looks = {
            ...this.looks,
            [name]: look
        };

        await this.#triggerRealtime(name);
    }

    #id(name: string): string {
        return `${SETTING_TIMER_PREFIX}${slugify(name)}`;
    }

    #clear(timer: StoredTimer): void {
        const timeouts = this.#timeouts[timer.id];

        if (!timeouts) {
            return;
        }

        this.log(`Clear timer timeouts for ${timer.name}.`);
        timeouts.forEach(timeout => this.clearTimeout(timeout));
        delete this.#timeouts[timer.id];
    }

    #find(name: string): StoredTimer | null {
        return Object.values(this.#timers).find(t => t.name === name) ?? null;
    }

    async #findAll(): Promise<StoredTimer[]> {
        const allSettings = this.settings.getKeys();
        const autocompleteProvider = this.#autocompleteProvider();
        const definedTimers = await autocompleteProvider.find('');
        const timers: StoredTimer[] = [];
        const checkKeys: (keyof StoredTimer)[] = ['name', 'duration', 'remaining', 'target', 'status'];

        for (const setting of allSettings) {
            if (!setting.startsWith(SETTING_TIMER_PREFIX)) {
                continue;
            }

            const timer: StoredTimer = this.settings.get(setting);
            const isValid = timer && checkKeys.every(key => key in timer);

            if (!isValid || !definedTimers.find(t => t.name === timer.name)) {
                timer && this.#remove(timer.id);
                continue;
            }

            timers.push({
                id: setting,
                name: timer.name,
                duration: timer.duration,
                remaining: timer.remaining,
                target: timer.target,
                status: timer.status
            });
        }

        return timers;
    }

    #remove(id: string): void {
        this.settings.unset(id);
        delete this.#timers[id];
    }

    #save(name: string, duration: number, unit: ClockUnit, status: ClockState): void {
        const now = DateTime.now().toSeconds();
        const remaining = convertDurationToSeconds(duration, unit);
        const target = now + remaining + 1;

        this.#update(name, remaining, remaining, target, status);
    }

    async #schedule(): Promise<void> {
        const now = DateTime.now().toSeconds();
        const timers = await this.#findAll();
        const remainingTriggers: { timer: { name: string }, duration: number, unit: ClockUnit }[] = await this.homey.flow
            .getTriggerCard('timer_remaining')
            .getArgumentValues()
            .catch(() => []);

        this.#timers = {};

        for (const timer of timers) {
            this.#clear(timer);

            const diff = Math.floor(timer.target - now);
            const triggers = remainingTriggers
                .filter(t => t.timer.name === timer.name)
                .filter((t, index, arr) => arr.findIndex(tt => tt.duration === t.duration && tt.unit === t.unit) === index);

            if (diff > 0 && timer.status === 'running') {
                this.log(`Timer ${timer.name} is scheduled to finish in ${diff} seconds.`);

                const timeouts: NodeJS.Timeout[] = [];

                timeouts.push(
                    this.setTimeout(async () => {
                        await this.finish(timer);
                        await this.#schedule();
                    }, diff * 1000)
                );

                for (const trigger of triggers) {
                    const triggerDuration = convertDurationToSeconds(trigger.duration, trigger.unit);
                    const triggerDiff = diff - triggerDuration;

                    if (triggerDiff <= 0) {
                        continue;
                    }

                    timeouts.push(
                        this.setTimeout(async () => {
                            await this.#triggerRemaining(timer.name, trigger.duration, trigger.unit);
                        }, triggerDiff * 1000)
                    );
                }

                this.#timeouts[timer.id] = timeouts;
            } else if (diff >= -TIMER_FINISH_GRACE_PERIOD && timer.status === 'running') {
                // todo(Bas): Decide if this 5 second grace period is wanted.
                await this.finish(timer);
            }

            this.#timers[timer.id] = timer;
            await this.#triggerRealtime(timer.name);
        }
    }

    #update(name: string, duration: number, remaining: number, target: number, status: ClockState): void {
        const id = this.#id(name);

        this.settings.set(id, {
            id,
            name,
            duration,
            remaining,
            target,
            status
        } satisfies StoredTimer);
    }

    async #triggerFinished(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.TimerFinished)
            ?.trigger({timer: name});

        this.log(`Triggered timer finished for ${name}.`);
    }

    async #triggerPaused(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.TimerPaused)
            ?.trigger({timer: name});

        this.log(`Triggered timer paused for ${name}.`);
    }

    async #triggerRemaining(name: string, duration: number, unit: ClockUnit): Promise<void> {
        this.registry
            .findTrigger(Triggers.TimerRemaining)
            ?.trigger({timer: name, duration, unit});

        this.log(`Triggered timer remaining for ${name}.`);
    }

    async #triggerResumed(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.TimerResumed)
            ?.trigger({timer: name});

        this.log(`Triggered timer resumed for ${name}.`);
    }

    async #triggerStarted(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.TimerStarted)
            ?.trigger({timer: name});

        this.log(`Triggered timer started for ${name}.`);
    }

    async #triggerStopped(name: string): Promise<void> {
        this.registry
            .findTrigger(Triggers.TimerStopped)
            ?.trigger({timer: name});

        this.log(`Triggered timer stopped for ${name}.`);
    }

    async #triggerRealtime(name: string): Promise<void> {
        const timer = await this.find(name);

        if (!timer) {
            return;
        }

        this.realtime(REALTIME_TIMER_UPDATE, timer);
    }

    #autocompleteProvider(): AutocompleteProviders.Timer {
        const provider = this.registry.findAutocompleteProvider(AutocompleteProviders.Timer);

        if (!provider) {
            throw new Error('Failed to get the timer autocomplete provider.');
        }

        return provider;
    }
}

type StoredTimer = {
    readonly id: string;
    readonly name: string;
    readonly duration: number;
    readonly remaining: number;
    readonly target: number;
    readonly status: ClockState;
};
