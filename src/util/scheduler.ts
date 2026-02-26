import { MAX_TIMEOUT_MS } from '../const';

type ScheduledEntry = {
    readonly id: string;
    readonly runAt: number;
    readonly callback: () => Promise<void>;
};

export class Scheduler {
    readonly #entries: Map<string, ScheduledEntry> = new Map();
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

    schedule(id: string, callback: () => Promise<void>, delayMs: number): void {
        const runAt = Date.now() + Math.max(0, delayMs);
        this.#entries.set(id, { id, runAt, callback });
        this.#reschedule();
    }

    cancel(id: string): void {
        if (this.#entries.delete(id)) {
            this.#reschedule();
        }
    }

    cancelAll(prefix: string): void {
        let deleted = false;

        for (const id of this.#entries.keys()) {
            if (id.startsWith(prefix)) {
                this.#entries.delete(id);
                deleted = true;
            }
        }

        if (deleted) {
            this.#reschedule();
        }
    }

    #reschedule(): void {
        if (this.#timeout !== null) {
            this.#clearTimeoutFn(this.#timeout);
            this.#timeout = null;
        }

        let earliest: ScheduledEntry | null = null;

        for (const entry of this.#entries.values()) {
            if (!earliest || entry.runAt < earliest.runAt) {
                earliest = entry;
            }
        }

        if (!earliest) {
            return;
        }

        const diff = Math.max(0, earliest.runAt - Date.now());
        const delay = Math.min(diff, MAX_TIMEOUT_MS);
        const entryId = earliest.id;

        this.#timeout = this.#setTimeoutFn(() => {
            void (async () => {
                this.#timeout = null;
                const entry = this.#entries.get(entryId);

                if (entry && entry.runAt <= Date.now()) {
                    this.#entries.delete(entryId);

                    try {
                        await entry.callback();
                    } catch {
                        // Errors in scheduled callbacks are intentionally suppressed here.
                        // Each callback is responsible for its own error handling.
                    }
                }

                this.#reschedule();
            })();
        }, delay);
    }
}
