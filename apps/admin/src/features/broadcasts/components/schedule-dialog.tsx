"use client"

import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { TOUCH } from "../../shared/utils/touch"
import { isoToTashkentLocal, tashkentLocalToIso } from "../utils/broadcast-form"

/** Event-time check (not called during render): is the typed Tashkent time still ahead? */
function isFuture(local: string): boolean {
  const iso = tashkentLocalToIso(local)
  return iso !== null && new Date(iso).getTime() > Date.now()
}

/** Pick the send time (Asia/Tashkent). The time must be in the future. */
export function ScheduleDialog({
  open,
  onOpenChange,
  initialIso,
  loading,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialIso: string | null
  loading: boolean
  onSubmit: (iso: string) => void
}) {
  const t = useT("broadcasts.schedule")
  const [local, setLocal] = useState("")
  const [inFuture, setInFuture] = useState(false)

  function change(next: string) {
    setLocal(next)
    setInFuture(isFuture(next))
  }

  useEffect(() => {
    if (!open) return
    const next = initialIso ? isoToTashkentLocal(initialIso) : ""
    setLocal(next)
    setInFuture(isFuture(next))
  }, [open, initialIso])

  const iso = tashkentLocalToIso(local)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (iso && inFuture) onSubmit(iso)
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          <LabeledField
            label={t("when")}
            htmlFor="broadcast-when"
            description={local !== "" && !inFuture ? t("past") : t("hint")}
            required
          >
            <Input
              id="broadcast-when"
              type="datetime-local"
              value={local}
              className={TOUCH}
              onChange={(event) => change(event.target.value)}
            />
          </LabeledField>
          <DialogFooter>
            <Button type="button" variant="outline" className={TOUCH} onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" className={TOUCH} disabled={!inFuture || loading}>
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
