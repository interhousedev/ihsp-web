"use client"

import type { Excuse } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { DatePicker, LoadingButton } from "@ihsp/ui"
import { useId, useState } from "react"
import { toast } from "sonner"

/** Sets the last day of an approved excuse (`PATCH {ends_on}`); an open-ended excuse is closed this way. */
export function ExcuseEndForm({
  excuse,
  busy,
  onEnd,
}: {
  excuse: Excuse
  busy: boolean
  onEnd: (endsOn: string) => Promise<unknown>
}) {
  const t = useT("excuses")
  const errorMessage = useErrorMessage()
  const id = useId()
  const [value, setValue] = useState<string | null>(excuse.ends_on)

  const save = () => {
    if (!value) return
    onEnd(value).then(
      () => toast.success(t("decision.ended")),
      (error: unknown) => toast.error(errorMessage(error)),
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {t("actions.endOn")}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <DatePicker id={id} value={value} min={excuse.starts_on} onChange={setValue} />
        <LoadingButton
          variant="outline"
          className="min-h-11 md:min-h-8"
          loading={busy}
          disabled={!value || value === excuse.ends_on}
          onClick={save}
        >
          {t("actions.endSave")}
        </LoadingButton>
      </div>
    </div>
  )
}
