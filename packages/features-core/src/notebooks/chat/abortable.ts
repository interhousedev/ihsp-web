/**
 * Re-yields the items of `source` and fails with an `AbortError` as soon as `signal` aborts, even while a read is
 * still waiting. A browser aborts the body of a `fetch` itself; this keeps Stop working with a body that does not
 * (a proxy that buffers, a mocked response).
 */
export async function* abortable<T>(source: AsyncGenerator<T>, signal: AbortSignal): AsyncGenerator<T> {
  const aborted = new Promise<never>((_resolve, reject) => {
    const fail = () => reject(new DOMException("The answer was stopped", "AbortError"))
    if (signal.aborted) fail()
    else signal.addEventListener("abort", fail, { once: true })
  })
  aborted.catch(() => undefined)
  try {
    for (;;) {
      signal.throwIfAborted()
      const next = await Promise.race([source.next(), aborted])
      if (next.done) return
      yield next.value
    }
  } finally {
    // Queued behind a pending read, which may never settle: nothing waits for it.
    source.return(undefined).catch(() => undefined)
  }
}
