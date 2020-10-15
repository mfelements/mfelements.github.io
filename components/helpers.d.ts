export function sleep(ms: number): Promise<void>

export function setAsyncIntervalImmediate<F extends (...args: any[]) => Promise<void>>(asyncF: F, timeout: number, ...args: any[]): () => void
