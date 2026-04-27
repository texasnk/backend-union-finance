export class MemoryCache<T> {
    private readonly values = new Map<string, { expiresAt: number; value: T }>()

    constructor(private readonly ttlMs: number) { }

    /** Returns a cached value when it is still inside the configured TTL. */
    get(key: string): T | null {
        const cached = this.values.get(key)

        if (!cached) {
            return null
        }

        if (cached.expiresAt <= Date.now()) {
            this.values.delete(key)
            return null
        }

        return cached.value
    }

    /** Stores a value with an absolute expiration timestamp. */
    set(key: string, value: T): void {
        this.values.set(key, {
            value,
            expiresAt: Date.now() + this.ttlMs,
        })
    }
}
