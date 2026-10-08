"use client"

import { keys, postAdminGroups } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@ihsp/ui"
import { useEffect, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

function toInt(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** New group by name; the EMIS group id links it to EMIS (UF-ADM-04 step 2). */
export function CreateGroupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("groups.create")
  const [name, setName] = useState("")
  const [emisId, setEmisId] = useState("")
  const [semester, setSemester] = useState("")

  useEffect(() => {
    if (open) {
      setName("")
      setEmisId("")
      setSemester("")
    }
  }, [open])

  const create = useAdminMutation({
    mutationFn: () =>
      postAdminGroups({
        name: name.trim(),
        emis_group_id: toInt(emisId),
        current_semester: toInt(semester),
      }),
    invalidate: [keys.admin.groups.all()],
    success: t("done", { name: name.trim() }),
    onSuccess: () => onOpenChange(false),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (name.trim()) create.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <LabeledField label={t("name")} htmlFor="group-name" required>
            <Input
              id="group-name"
              value={name}
              className={TOUCH}
              maxLength={32}
              onChange={(event) => setName(event.target.value)}
            />
          </LabeledField>
          <LabeledField label={t("emisId")} htmlFor="group-emis" description={t("emisHint")}>
            <Input
              id="group-emis"
              inputMode="numeric"
              value={emisId}
              className={TOUCH}
              onChange={(event) => setEmisId(event.target.value.replace(/\D/g, ""))}
            />
          </LabeledField>
          <LabeledField label={t("semester")} htmlFor="group-semester">
            <Input
              id="group-semester"
              inputMode="numeric"
              value={semester}
              className={TOUCH}
              onChange={(event) => setSemester(event.target.value.replace(/\D/g, "").slice(0, 2))}
            />
          </LabeledField>
          <DialogFooter>
            <Button type="button" variant="outline" className={TOUCH} onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" className={TOUCH} disabled={!name.trim() || create.isPending}>
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
