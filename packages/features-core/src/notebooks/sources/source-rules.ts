import type { SourceItem, SourceKind } from "@ihsp/api"

/** Kinds whose content can change upstream; **Sync** re-reads them. */
const SYNCABLE_KINDS: ReadonlySet<SourceKind> = new Set(["chat", "flashcard_set", "lms_step", "url", "web_result"])

/** Whether the row menu offers **Sync**: re-readable kinds, outdated sources and failures that may be temporary. */
export function canSync(source: Pick<SourceItem, "kind" | "status" | "failure">): boolean {
  if (source.status === "pending" || source.status === "processing") return false
  if (source.status === "stale") return true
  if (source.status === "failed") return source.failure === "provider_error" || source.failure === "fetch_failed"
  return SYNCABLE_KINDS.has(source.kind)
}

/** Failures where the source had no text to read: a scan, a video without captions. */
const NO_TEXT_FAILURES: ReadonlySet<string> = new Set(["no_text", "no_transcript"])

/** Whether the row offers **Re-read**: the text was not found, so reading it again may find it now. */
export function canReread(source: Pick<SourceItem, "status" | "failure">): boolean {
  return source.status === "failed" && NO_TEXT_FAILURES.has(source.failure ?? "")
}

/** Pasted text and notes can be edited in the note editor. */
export function isEditableKind(kind: SourceKind): boolean {
  return kind === "note" || kind === "text"
}

/** The source guide (summary and key topics) is built for everything except notes and pasted text. */
export function hasGuideKind(kind: SourceKind): boolean {
  return !isEditableKind(kind)
}

/** The `ref` value as text (`ref` holds strings and numbers). */
export function refValue(source: Pick<SourceItem, "ref">, key: string): string | null {
  const value = source.ref[key]
  return value === undefined ? null : String(value)
}
