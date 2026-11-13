/**
 * Copies stored records into prototype-less objects, so user-chosen names such as
 * `constructor` or `toString` never resolve to inherited properties.
 */
export default function plainRecord<T>(value: T | null | undefined): T {
    return copy(value ?? {}) as T;
}

/** Same as `Object.fromEntries()`, but prototype-less. */
export function recordFromEntries<T>(entries: Iterable<readonly [string, T]>): Record<string, T> {
    return plainRecord(Object.fromEntries(entries));
}

function copy(value: unknown): unknown {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    const prototype = Object.getPrototypeOf(value);

    if (prototype !== Object.prototype && prototype !== null) {
        return value;
    }

    const result = Object.create(null);

    for (const [key, entry] of Object.entries(value)) {
        result[key] = copy(entry);
    }

    return result;
}
