"use client"

import type { WorkOffTemplate } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { useState } from "react"
import { defaultDraft, type WorkOffDraft } from "../utils/work-offs"
import { WorkOffDialog } from "./work-off-dialog"

/**
 * The save buttons of the attendance form: "Save" keeps the work-off choices made per student, "Save without work-off
 * tasks" attaches none, and "Save and give one common task to all absent" asks for one task for every absent student.
 */
export function SaveAttendanceControls({
  label,
  disabled,
  pending,
  absent,
  templates,
  onSave,
  onSaveWithout,
  onSaveCommon,
}: {
  label: string
  /** Nothing to save yet. */
  disabled: boolean
  pending: boolean
  absent: number
  templates: readonly WorkOffTemplate[]
  onSave: () => void
  onSaveWithout: () => void
  onSaveCommon: (draft: WorkOffDraft) => void
}) {
  const t = useT("lessonDetail.attendance")
  const tw = useT("lessonDetail.workOff")
  const [common, setCommon] = useState(false)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <Button className="min-h-11 w-full md:min-h-8 md:w-fit" disabled={pending || disabled} onClick={onSave}>
        {pending ? t("saving") : label}
      </Button>
      <Button
        variant="outline"
        className="min-h-11 w-full md:min-h-8 md:w-fit"
        disabled={pending || disabled || absent === 0}
        onClick={onSaveWithout}
      >
        {t("saveWithout")}
      </Button>
      <Button
        variant="outline"
        className="min-h-11 w-full md:min-h-8 md:w-fit"
        disabled={pending || absent === 0}
        onClick={() => setCommon(true)}
      >
        {t("saveCommon")}
      </Button>
      {common ? (
        <WorkOffDialog
          key={templates.length > 0 ? "templates" : "loading"}
          title={tw("commonTitle")}
          mode="choose"
          templates={templates}
          initial={defaultDraft(templates)}
          requireText
          onClose={() => setCommon(false)}
          onSubmit={(draft) => {
            setCommon(false)
            onSaveCommon(draft)
          }}
        />
      ) : null}
    </div>
  )
}
