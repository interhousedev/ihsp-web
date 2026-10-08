"use client"

import { postAdminTimetableCopy, type Term } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

/** Copy the timetable of another term into the open one, then adjust it (UF-ADM-06 step 4). */
export function CopyTermDialog({
  target,
  terms,
  open,
  onOpenChange,
}: {
  target: Term
  terms: Term[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("timetable.copy")
  const sources = terms.filter((term) => term.id !== target.id)
  const [sourceId, setSourceId] = useState("")

  useEffect(() => {
    if (open) setSourceId(terms.find((term) => term.id !== target.id)?.id ?? "")
  }, [open, terms, target.id])

  const copy = useAdminMutation({
    mutationFn: () => postAdminTimetableCopy({ from_term_id: sourceId, to_term_id: target.id }),
    invalidate: [
      ["admin", "timetable"],
      ["admin", "lessons"],
    ],
    success: (data) => t("done", { count: data.created }),
    onSuccess: () => onOpenChange(false),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (sourceId) copy.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title", { year: target.academic_year, half: target.half })}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <LabeledField label={t("from")} htmlFor="copy-from" required>
            <SelectField
              id="copy-from"
              value={sourceId}
              emptyLabel={t("choose")}
              options={sources.map((term) => ({
                value: term.id,
                label: t("termLabel", { year: term.academic_year, half: term.half }),
              }))}
              onChange={setSourceId}
            />
          </LabeledField>
          <DialogFooter>
            <Button type="button" variant="outline" className={TOUCH} onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" className={TOUCH} disabled={!sourceId || copy.isPending}>
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
