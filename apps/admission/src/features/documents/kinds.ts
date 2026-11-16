export type DocumentState = "checking" | "blocked" | "rejected" | "accepted" | "attached" | "uploaded"

/** The state chain of a document row (spec S8). */
export function documentState(doc: {
  review_status: string
  versions: { version: number; scan_status: string }[]
  current_version: number
  attachments: unknown[]
}): DocumentState {
  const current = doc.versions.find((version) => version.version === doc.current_version)
  if (current?.scan_status === "infected" || current?.scan_status === "failed") return "blocked"
  if (current && (current.scan_status === "pending_scan" || current.scan_status === "unscanned")) return "checking"
  if (doc.review_status === "rejected") return "rejected"
  if (doc.attachments.length > 0) return "attached"
  if (doc.review_status === "accepted") return "accepted"
  return "uploaded"
}

export const DOCUMENT_TONE: Record<DocumentState, "success" | "warning" | "info" | "destructive" | "neutral"> = {
  checking: "info",
  blocked: "destructive",
  rejected: "destructive",
  accepted: "success",
  attached: "success",
  uploaded: "neutral",
}
