"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Input, LoadingButton } from "@ihsp/ui"
import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useOfficerSettings, useSetPickup } from "../api"

const LOCALES = ["uz", "ru", "en"] as const

/** Where paper transcripts are picked up, in three languages (PUT /officer/settings). */
export function PickupForm() {
  const t = useT("transcripts")
  const errorMessage = useErrorMessage()
  const settings = useOfficerSettings()
  const save = useSetPickup()
  const [values, setValues] = useState<Record<string, string>>({})
  useEffect(() => {
    if (settings.data) setValues(settings.data.pickup_location)
  }, [settings.data])

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await save.mutateAsync(values)
      toast.success(t("pickupSaved"))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-card border p-3">
      <h2 className="text-lg font-semibold">{t("pickupTitle")}</h2>
      <p className="text-muted-foreground text-sm">{t("pickupHint")}</p>
      {LOCALES.map((locale) => (
        <label key={locale} className="flex flex-col gap-1 text-sm">
          {t(`locale.${locale}`)}
          <Input
            placeholder={t("pickupPlaceholder")}
            value={values[locale] ?? ""}
            onChange={(event) => setValues((prev) => ({ ...prev, [locale]: event.target.value }))}
          />
        </label>
      ))}
      <LoadingButton type="submit" loading={save.isPending} className="self-start">
        {t("pickupSave")}
      </LoadingButton>
    </form>
  )
}
