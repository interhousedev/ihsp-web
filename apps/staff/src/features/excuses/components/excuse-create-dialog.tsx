"use client"

import { useT } from "@ihsp/i18n"
import { ResponsiveDialog } from "@ihsp/ui"
import { GroupScope } from "../../group/components/group-scope"
import { ExcuseExclusionForm } from "./excuse-exclusion-form"

/** Excuse a student of the curated group (`POST /v1/staff/excuses`). */
export function ExcuseCreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT("excuses.form")
  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => !next && onClose()} title={t("title")} size="md">
      <GroupScope>{(group) => <ExcuseExclusionForm key={group.id} group={group} onDone={onClose} />}</GroupScope>
    </ResponsiveDialog>
  )
}
