/**
 * Guarantees that an async promise settles within timeoutMs.
 * If the promise exceeds timeoutMs, it logs a warning and returns fallbackValue immediately.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 2500,
  fallbackValue: T
): Promise<T> {
  let timerId: any = null;

  const timeoutPromise = new Promise<T>((resolve) => {
    timerId = setTimeout(() => {
      console.warn(`[Promise Timeout] Request exceeded ${timeoutMs}ms limit. Returning fallback data.`);
      resolve(fallbackValue);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).then((result) => {
    if (timerId) clearTimeout(timerId);
    return result;
  }).catch((err) => {
    if (timerId) clearTimeout(timerId);
    console.error('[Promise Error] Async request failed:', err?.message || err);
    return fallbackValue;
  });
}
