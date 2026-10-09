import type { NotebookDetail } from "@ihsp/api"

/** How often the notebook is refetched while its summary is rebuilt. */
export const SUMMARY_POLL_MS = 4000
/** The polling stops this long after it started, so a summary that never finishes cannot poll forever. */
export const SUMMARY_POLL_WINDOW_MS = 2 * 60_000

type SummaryStatus = NotebookDetail["summary_status"]

/**
 * The `refetchInterval` rule of the notebook query: poll while `summary_status` is `stale` or `building`, for at most
 * two minutes from the first such poll. Returns a function `(notebookId, status) => delay | false`; it remembers when
 * the window opened and closes it as soon as the summary is in any other state. `now` is injectable for tests.
 */
export function createSummaryPoll(now: () => number = Date.now) {
  let started: { notebookId: string; at: number } | null = null
  return (notebookId: string, status: SummaryStatus | undefined): number | false => {
    if (status !== "stale" && status !== "building") {
      started = null
      return false
    }
    if (started?.notebookId !== notebookId) started = { notebookId, at: now() }
    return now() - started.at < SUMMARY_POLL_WINDOW_MS ? SUMMARY_POLL_MS : false
  }
}
