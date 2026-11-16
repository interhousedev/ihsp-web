"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Checkbox, Input, LoadingButton, Skeleton } from "@ihsp/ui"
import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { usePrefs, useSavePrefs, type ReminderPrefs } from "../api"
import { useWorkflow } from "../../../lib/config"

function toggle<T>(list: T[], value: T, on: boolean): T[] {
  return on ? [...list.filter((v) => v !== value), value] : list.filter((v) => v !== value)
}

/** When and where deadline reminders arrive (PUT /reminder-prefs). */
export function PrefsForm() {
  const t = useT("deadlines")
  const errorMessage = useErrorMessage()
  const workflow = useWorkflow()
  const query = usePrefs()
  const save = useSavePrefs()
  const [prefs, setPrefs] = useState<ReminderPrefs | null>(null)
  useEffect(() => {
    if (query.data) setPrefs(query.data)
  }, [query.data])
  if (!prefs) return <Skeleton className="h-32 w-full" />

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!prefs) return
    try {
      await save.mutateAsync({ ...prefs, offsets_days: [...prefs.offsets_days].sort((a, b) => b - a) })
      toast.success(t("prefsSaved"))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-card border p-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{t("offsetsLabel")}</legend>
        <div className="flex flex-wrap gap-3">
          {workflow.reminder_offsets.map((days) => (
            <label key={days} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={prefs.offsets_days.includes(days)}
                onCheckedChange={(on) => setPrefs({ ...prefs, offsets_days: toggle(prefs.offsets_days, days, on) })}
              />
              {t("daysBefore", { days })}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{t("channelsLabel")}</legend>
        <div className="flex flex-wrap gap-3">
          {workflow.reminder_channels.map((channel) => (
            <label key={channel} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={prefs.channels.includes(channel)}
                onCheckedChange={(on) => setPrefs({ ...prefs, channels: toggle(prefs.channels, channel, on) })}
              />
              {t(`channel.${channel}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t("quietFrom")}
          <Input
            type="time"
            value={prefs.quiet_from.slice(0, 5)}
            onChange={(e) => setPrefs({ ...prefs, quiet_from: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("quietTo")}
          <Input
            type="time"
            value={prefs.quiet_to.slice(0, 5)}
            onChange={(e) => setPrefs({ ...prefs, quiet_to: e.target.value })}
          />
        </label>
      </div>
      <LoadingButton type="submit" loading={save.isPending} className="self-start">
        {t("save")}
      </LoadingButton>
    </form>
  )
}
