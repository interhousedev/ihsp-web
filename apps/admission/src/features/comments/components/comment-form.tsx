"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Switch, Textarea } from "@ihsp/ui"
import { useId, useState, type FormEvent } from "react"
import type { CommentVisibility } from "../api"

/** A new comment; the switch makes it staff-only (the student never sees it). */
export function CommentForm({
  pending,
  onSubmit,
}: {
  pending: boolean
  onSubmit: (input: { body: string; visibility: CommentVisibility }) => Promise<unknown>
}) {
  const t = useT("comments")
  const id = useId()
  const [body, setBody] = useState("")
  const [staffOnly, setStaffOnly] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const text = body.trim()
    if (!text) return
    await onSubmit({ body: text, visibility: staffOnly ? "staff_only" : "student_and_staff" })
    setBody("")
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Textarea
        aria-label={t("bodyLabel")}
        placeholder={t("bodyPlaceholder")}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        disabled={pending}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor={id} className="flex items-center gap-2 text-sm">
          <Switch id={id} checked={staffOnly} onCheckedChange={setStaffOnly} aria-label={t("staffOnly")} />
          <span>{staffOnly ? t("staffOnly") : t("visibleToStudent")}</span>
        </label>
        <Button type="submit" disabled={pending || !body.trim()}>
          <Icons.send className="size-4" />
          {t("send")}
        </Button>
      </div>
    </form>
  )
}
