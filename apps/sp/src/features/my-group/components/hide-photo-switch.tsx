"use client"

import { usePreferences, useUpdatePreferences } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Switch } from "@ihsp/ui"
import { useId } from "react"

/** "Do not show my photo to my classmates": saved in the account preferences, used by Settings and My group. */
export function HidePhotoSwitch() {
  const t = useT("myGroup")
  const preferences = usePreferences()
  const update = useUpdatePreferences()
  const labelId = useId()
  if (!preferences) return null
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
      <span className="min-w-0">
        <span id={labelId} className="block text-sm font-medium">
          {t("hidePhoto")}
        </span>
        <span className="text-muted-foreground block text-xs">{t("hidePhotoHint")}</span>
      </span>
      <Switch
        aria-labelledby={labelId}
        checked={preferences.hide_photo_from_classmates}
        onCheckedChange={(value) => update.mutate({ hide_photo_from_classmates: value })}
      />
    </label>
  )
}
