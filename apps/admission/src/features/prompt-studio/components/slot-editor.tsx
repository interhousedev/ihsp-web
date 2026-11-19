"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, Label, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { blockingCodes, useSaveSlot, type PromptIssue, type Slot } from "../api"
import { asIssues, IssueList } from "./issue-list"
import { TestPanel } from "./test-panel"
import { VersionsPanel } from "./versions-panel"

/** Edits one slot: the draft text with placeholder hints, validation, the test run and the history. Remount per slot. */
export function SlotEditor({ slot }: { slot: Slot }) {
  const t = useT("promptStudio")
  const errorMessage = useErrorMessage()
  const save = useSaveSlot(slot)
  const [text, setText] = useState(slot.active_text)
  const [note, setNote] = useState("")
  const [warnings, setWarnings] = useState<PromptIssue[]>([])
  const codes = blockingCodes(save.error)
  const dirty = text !== slot.active_text
  const submit = () =>
    save.mutate(
      { text, note },
      {
        onSuccess: (saved) => {
          setWarnings(saved.warnings)
          setNote("")
          toast.success(t("saved", { version: saved.version.version }))
        },
        onError: (e) => {
          setWarnings([])
          if (blockingCodes(e).length === 0) toast.error(errorMessage(e))
        },
      },
    )
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{slot.name}</h2>
          <p className="text-muted-foreground text-sm">{slot.summary}</p>
        </div>
        {slot.fields.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">{t("placeholders")}</span>
            {slot.fields.map((f) => (
              <Button
                key={f}
                type="button"
                size="sm"
                variant="outline"
                className="font-mono"
                onClick={() => setText((v) => `${v}{${f}}`)}
              >
                {`{${f}}`}
              </Button>
            ))}
          </div>
        ) : null}
        <Label htmlFor="studio-text">{t("editor")}</Label>
        <Textarea
          id="studio-text"
          className="min-h-72 font-mono text-sm"
          rows={16}
          value={text}
          aria-invalid={codes.length > 0}
          onChange={(e) => setText(e.target.value)}
        />
        <IssueList issues={asIssues(codes)} tone="error" />
        <IssueList issues={warnings} tone="warning" />
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-48 flex-1 flex-col gap-1">
            <Label htmlFor="studio-note">{t("note")}</Label>
            <Input id="studio-note" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="button" variant="ghost" disabled={!dirty} onClick={() => setText(slot.active_text)}>
            {t("discard")}
          </Button>
          <Button type="button" disabled={save.isPending || text.trim() === ""} onClick={submit}>
            {t("publish")}
          </Button>
        </div>
      </section>
      <TestPanel slot={slot} text={text} />
      <VersionsPanel slot={slot} onLoad={setText} />
    </div>
  )
}
