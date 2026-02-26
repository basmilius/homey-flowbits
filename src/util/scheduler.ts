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

const NOTIFY_DEBOUNCE_MS = 50;

export class Scheduler {
    readonly #features: Map<string, Schedulable> = new Map();
    #timeout: NodeJS.Timeout | null = null;
    #debounce: NodeJS.Timeout | null = null;
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

    // Debounced: rapid-fire calls within NOTIFY_DEBOUNCE_MS coalesce into a single reschedule.
    notify(): void {
        if (this.#debounce !== null) {
            this.#clearTimeoutFn(this.#debounce);
        }

        this.#debounce = this.#setTimeoutFn(() => {
            this.#debounce = null;
            this.#reschedule();
        }, NOTIFY_DEBOUNCE_MS);
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

        // Collect all pending events from all features, sorted earliest-first.
        type PendingEvent = { event: { id: string; description: string; runAt: number }; feature: Schedulable };
        const all: PendingEvent[] = [];

        for (const feature of this.#features.values()) {
            for (const event of feature.getScheduledEvents()) {
                all.push({ event, feature });
            }
        }

        if (all.length === 0) {
            return;
        }

        all.sort((a, b) => a.event.runAt - b.event.runAt);

        const earliest = all[0].event.runAt;
        const diff = Math.max(0, earliest - Date.now());
        const delay = Math.min(diff, MAX_TIMEOUT_MS);

        this.#timeout = this.#setTimeoutFn(() => {
            void (async () => {
                this.#timeout = null;

                const now = Date.now();

                // Collect all events that are due (runAt <= now), not just the earliest one.
                // This handles multiple events scheduled for the exact same time.
                const due: PendingEvent[] = [];

                for (const feature of this.#features.values()) {
                    for (const event of feature.getScheduledEvents()) {
                        if (event.runAt <= now) {
                            due.push({ event, feature });
                        }
                    }
                }

                await Promise.allSettled(
                    due.map(({ event, feature }) => feature.executeScheduledEvent(event.id))
                );

                this.#reschedule();
            })();
        }, delay);
    }
}
