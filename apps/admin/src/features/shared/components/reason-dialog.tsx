"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from "@ihsp/ui"
import { useEffect, useId, useState } from "react"
import { TOUCH } from "../utils/touch"
import { LabeledField } from "./labeled-field"

/**
 * Asks for a reason before a sensitive action (block a user, suspend a mailbox, disable a link). The confirm button
 * stays off until a reason is typed; the reason is trimmed.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  reasonLabel,
  destructive = true,
  loading = false,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel: string
  reasonLabel: string
  destructive?: boolean
  loading?: boolean
  onSubmit: (reason: string) => void
}) {
  const t = useT()
  const fieldId = useId()
  const [reason, setReason] = useState("")

  useEffect(() => {
    if (open) setReason("")
  }, [open])

  const trimmed = reason.trim()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (trimmed) onSubmit(trimmed)
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <LabeledField label={reasonLabel} htmlFor={fieldId} required>
            <Textarea
              id={fieldId}
              value={reason}
              maxLength={500}
              rows={3}
              onChange={(event) => setReason(event.target.value)}
            />
          </LabeledField>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className={TOUCH}
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant={destructive ? "destructive" : "default"}
              className={TOUCH}
              disabled={loading || trimmed === ""}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
