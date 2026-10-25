"use client"

import type { ToolCallView as ToolCall } from "@ihsp/api"
import { IconSearch } from "@ihsp/ui"
import { ApprovalCard } from "./approval-card"
import { DocumentCard } from "./document-card"

type ToolCallViewProps = {
  call: ToolCall
  busy: boolean
  onApprove: (callId: string) => void
  onReject: (callId: string, reason: string | undefined) => void
}

/** Read tools are one-line "Looked up …" notes (AI-2); write tools are approval cards. */
export function ToolCallView({ call, busy, onApprove, onReject }: ToolCallViewProps) {
  if (call.document) return <DocumentCard document={call.document} />
  if (call.access === "read" || (!call.preview && call.status === "done")) {
    return (
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs italic" data-tool-note={call.tool}>
        <IconSearch className="size-3.5 shrink-0" aria-hidden />
        <span className="min-w-0 break-words">{call.note}</span>
      </p>
    )
  }
  return <ApprovalCard call={call} busy={busy} onApprove={onApprove} onReject={onReject} />
}
