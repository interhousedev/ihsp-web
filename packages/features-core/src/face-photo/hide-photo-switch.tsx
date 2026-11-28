"use client"

import { useT } from "@ihsp/i18n"
import { Switch } from "@ihsp/ui"
import { useId } from "react"
import { usePreferences, useUpdatePreferences } from "../notification-settings-form"

/**
 * "Hide my photo from the public": saved in the account preferences. The photo stays stored (the entrance device
 * still recognises the face); only the student and staff see it, everyone else gets a gray placeholder.
 */
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
        checked={preferences.hide_photo_from_public}
        onCheckedChange={(value) => update.mutate({ hide_photo_from_public: value })}
      />
    </label>
  )
}
