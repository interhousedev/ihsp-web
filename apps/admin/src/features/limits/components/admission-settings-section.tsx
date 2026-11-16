"use client"

import {
  getAdmissionPickupQuery,
  keys,
  putAdmissionPickup,
  type AdmissionPickupBody,
  type AdmissionPickupSettings,
} from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"

const LOCALES = ["uz", "ru", "en"] as const

/** Admission runtime settings: where applicants pick up their transcripts, per language. The admission AI limits sit in the limits editor. */
export function AdmissionSettingsSection() {
  const t = useT("limits.admission")
  const query = useQuery(getAdmissionPickupQuery())
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </CardHeader>
      <CardContent>
        <QueryState query={query} rows={3}>
          {(settings) => <PickupForm settings={settings} />}
        </QueryState>
      </CardContent>
    </Card>
  )
}

function PickupForm({ settings }: { settings: AdmissionPickupSettings }) {
  const t = useT("limits.admission")
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(LOCALES.map((locale) => [locale, settings.pickup_location[locale] ?? ""])),
  )
  const save = useAdminMutation<AdmissionPickupBody, AdmissionPickupSettings>({
    mutationFn: (body) => putAdmissionPickup(body),
    invalidate: [keys.admin.admissionPickup()],
    success: t("saved"),
    inlineError: true,
  })
  const changed = LOCALES.some((locale) => draft[locale] !== (settings.pickup_location[locale] ?? ""))
  return (
    <div className="flex flex-col gap-3">
      {LOCALES.map((locale) => (
        <div key={locale} className="flex flex-col gap-1.5">
          <Label htmlFor={`pickup-${locale}`}>{t("pickup", { language: t(`languages.${locale}`) })}</Label>
          <Input
            id={`pickup-${locale}`}
            value={draft[locale]}
            maxLength={300}
            onChange={(event) => setDraft({ ...draft, [locale]: event.target.value })}
          />
        </div>
      ))}
      <div className="flex items-center justify-end gap-3">
        {save.isError ? (
          <span role="alert" className="text-destructive text-sm">
            {t("failed")}
          </span>
        ) : null}
        <Button
          type="button"
          disabled={save.isPending || !changed}
          onClick={() => save.mutate({ pickup_location: draft })}
        >
          {t("save")}
        </Button>
      </div>
    </div>
  )
}
