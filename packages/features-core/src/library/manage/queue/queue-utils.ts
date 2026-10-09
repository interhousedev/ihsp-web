import {
  getManageQueueQuery,
  type ItemStatus,
  type ManageQueueRow,
  type ModerationAction,
  type QueueTab,
} from "@ihsp/api"

export const QUEUE_TABS: readonly QueueTab[] = ["review", "reports", "held", "rights", "suggestions"]

/** One page of 50 rows per tab: a full page is shown as "50+". */
export const QUEUE_LIMIT = 50

/** The query of a tab. The tab strip (counts) and the list share it, so a tab is fetched once. */
export const queueQuery = (tab: QueueTab) => getManageQueueQuery({ tab, limit: QUEUE_LIMIT })

/** A suggestion has no item id yet (`item.id` is null), so its own id is the key. */
export function rowKey(row: ManageQueueRow): string {
  return row.suggestion?.id ?? row.item.id ?? `${row.kind}:${row.item.title}`
}

/** What the librarian can do with a row, by tab: the item's state decides (review = pending, reports = published). */
export type RowAction = ModerationAction | "resolve" | "edit-rights" | "create-draft"

export function actionsFor(tab: QueueTab, row: ManageQueueRow): RowAction[] {
  switch (tab) {
    case "review":
      return ["approve", "request-changes", "reject"]
    case "reports":
      return row.report_ids && row.report_ids.length > 0 ? ["resolve", "hold", "unpublish"] : ["hold", "unpublish"]
    case "held":
      return row.report_ids && row.report_ids.length > 0
        ? ["restore", "unpublish", "resolve"]
        : ["restore", "unpublish"]
    case "rights":
      return ["edit-rights"]
    case "suggestions":
      return ["create-draft"]
  }
}

/** The state an item is in after a moderation action (the cache of the detail is not refetched before it is shown). */
export const STATUS_AFTER: Record<ModerationAction, ItemStatus> = {
  approve: "published",
  "request-changes": "changes_requested",
  reject: "rejected",
  hold: "held",
  restore: "published",
  unpublish: "unpublished",
}

/** The actions that need a written reason (all but approve). */
export const needsReason = (action: ModerationAction): boolean => action !== "approve"

/** Whole hours since `iso`; used for the "older than 2 school days" warning. */
export function ageInHours(iso: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - Date.parse(iso)) / 3_600_000))
}

/** A count for a tab strip: the number of rows, "N+" when the page was full. */
export function countLabel(rows: number, hasMore: boolean): string {
  return hasMore ? `${rows}+` : String(rows)
}

/** True when the key press happens in a place where letters are typed (a field, a select, an editable area). */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
}

/** The row to select after `key` was removed: the one that takes its place, or the one before it. */
export function neighbourKey(rows: readonly ManageQueueRow[], key: string): string | null {
  const index = rows.findIndex((row) => rowKey(row) === key)
  if (index < 0) return null
  const next = rows[index + 1] ?? rows[index - 1]
  return next ? rowKey(next) : null
}
