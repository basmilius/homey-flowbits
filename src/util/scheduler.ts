import { MAX_TIMEOUT_MS } from '../const';

export type ScheduledEvent = {
    readonly id: string;
    readonly feature: string;
    readonly description: string;
    readonly runAt: number;
};

export interface Schedulable {
    readonly schedulerFeature: string;
    getScheduledEvents(): ReadonlyArray<{ readonly id: string; readonly description: string; readonly runAt: number }>;
    executeScheduledEvent(id: string): Promise<void>;
}

export class Scheduler {
    readonly #features: Map<string, Schedulable> = new Map();
    #timeout: NodeJS.Timeout | null = null;
    readonly #setTimeoutFn: (callback: () => void, ms: number) => NodeJS.Timeout;
    readonly #clearTimeoutFn: (timeout: NodeJS.Timeout) => void;

    constructor(
        setTimeoutFn: (callback: () => void, ms: number) => NodeJS.Timeout,
        clearTimeoutFn: (timeout: NodeJS.Timeout) => void
    ) {
        this.#setTimeoutFn = setTimeoutFn;
        this.#clearTimeoutFn = clearTimeoutFn;
    }

    register(feature: Schedulable): void {
        this.#features.set(feature.schedulerFeature, feature);
    }

    notify(): void {
        this.#reschedule();
    }

    getUpcoming(): ScheduledEvent[] {
        const result: ScheduledEvent[] = [];

        for (const feature of this.#features.values()) {
            for (const event of feature.getScheduledEvents()) {
                result.push({
                    id: event.id,
                    feature: feature.schedulerFeature,
                    description: event.description,
                    runAt: event.runAt
                });
            }
        }

        return result.sort((a, b) => a.runAt - b.runAt);
    }

    #reschedule(): void {
        if (this.#timeout !== null) {
            this.#clearTimeoutFn(this.#timeout);
            this.#timeout = null;
        }

        let earliest: { event: { id: string; description: string; runAt: number }; feature: Schedulable } | null = null;

        for (const feature of this.#features.values()) {
            for (const event of feature.getScheduledEvents()) {
                if (!earliest || event.runAt < earliest.event.runAt) {
                    earliest = { event, feature };
                }
            }
        }

        if (!earliest) {
            return;
        }

        const diff = Math.max(0, earliest.event.runAt - Date.now());
        const delay = Math.min(diff, MAX_TIMEOUT_MS);
        const { event, feature } = earliest;

        this.#timeout = this.#setTimeoutFn(() => {
            void (async () => {
                this.#timeout = null;

                if (event.runAt <= Date.now()) {
                    try {
                        await feature.executeScheduledEvent(event.id);
                    } catch {
                        // Errors in scheduled event handlers are intentionally suppressed here.
                        // Each feature is responsible for its own error handling.
                    }
                }

                this.#reschedule();
            })();
        }, delay);
    }
}
