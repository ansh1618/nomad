/**
 * Executes an async promise without canceling real Supabase responses.
 * If execution takes longer than 5000ms, it logs a soft warning but allows the real query to complete.
 * Fallback values are ONLY returned if the promise throws a hard network exception.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  _timeoutMs: number = 30000,
  fallbackValue: T
): Promise<T> {
  const warnTimer = setTimeout(() => {
    console.warn(`[Promise Warning] Database query taking longer than 5000ms — waiting for Supabase response...`);
  }, 5000);

  return promise
    .then((result) => {
      clearTimeout(warnTimer);
      return result;
    })
    .catch((err) => {
      clearTimeout(warnTimer);
      console.error('[Promise Error] Database query exception caught:', err?.message || err);
      return fallbackValue;
    });
}
