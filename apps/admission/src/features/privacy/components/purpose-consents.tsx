"use client"

import { useErrorMessage, useFormatters, useLocale, useT } from "@ihsp/i18n"
import { Alert, Skeleton, Switch } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId } from "react"
import { toast } from "sonner"
import {
  consentKeys,
  consentQuery,
  deleteConsent,
  putConsent,
  purposesQuery,
  type Consent,
  type Purpose,
} from "../../consent/api"

function PurposeRow({
  purpose,
  grant,
  busy,
  onChange,
}: {
  purpose: Purpose
  grant: (Consent["grants"][number] & { reconsent_required?: boolean }) | undefined
  busy: boolean
  onChange: (checked: boolean) => void
}) {
  const t = useT("privacy")
  const format = useFormatters()
  const id = useId()
  const locale = useLocale()
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <div className="grid gap-0.5">
        <label htmlFor={id} className="text-sm font-medium">
          {purpose.title[locale] ?? purpose.title.en ?? purpose.id}
        </label>
        <p className="text-muted-foreground text-sm">{purpose.text[locale] ?? purpose.text.en ?? ""}</p>
        {grant?.active ? (
          <p className="text-muted-foreground text-xs">
            {t("purposes.givenAt", { date: format.date(grant.given_at) })}
          </p>
        ) : null}
        {grant?.reconsent_required ? (
          <p role="status" className="text-destructive text-xs">
            {t("purposes.reconsent")}
          </p>
        ) : null}
        {grant && !grant.active && grant.withdrawn_at ? (
          <p className="text-muted-foreground text-xs">
            {t("purposes.withdrawnAt", { date: format.date(grant.withdrawn_at) })}
          </p>
        ) : null}
      </div>
      <Switch id={id} checked={grant?.active === true} disabled={busy} onCheckedChange={onChange} />
    </li>
  )
}

/** Per-purpose consent: each switch grants (PUT) or withdraws (DELETE) one purpose. */
export function PurposeConsents() {
  const t = useT("privacy")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const consent = useQuery(consentQuery())
  const catalog = useQuery(purposesQuery())
  const change = useMutation({
    mutationFn: ({ purpose, checked }: { purpose: string; checked: boolean }) =>
      checked ? putConsent([purpose]) : deleteConsent(purpose),
    onSuccess: (data) => {
      queryClient.setQueryData(consentKeys.consent(), data)
      toast.success(t("purposes.saved"))
    },
  })

  const grants = consent.data?.grants ?? []
  const purposes = catalog.data?.items ?? []

  return (
    <section id="consent" className="grid scroll-mt-20 gap-2" aria-labelledby="purposes-title">
      <h2 id="purposes-title" className="text-base font-semibold">
        {t("purposes.title")}
      </h2>
      <p className="text-muted-foreground text-sm">{t("purposes.intro")}</p>
      <p className="text-muted-foreground text-sm">{t("purposes.voice")}</p>
      {consent.isPending || catalog.isPending ? <Skeleton className="h-40 w-full" /> : null}
      {consent.isError || catalog.isError ? (
        <Alert variant="destructive">{errorMessage(consent.error ?? catalog.error)}</Alert>
      ) : null}
      {consent.data && catalog.data ? (
        <>
          <ul className="divide-y">
            {purposes.map((purpose) => (
              <PurposeRow
                key={purpose.id}
                purpose={purpose}
                grant={grants.find((grant) => grant.purpose === purpose.id)}
                busy={change.isPending}
                onChange={(checked) => change.mutate({ purpose: purpose.id, checked })}
              />
            ))}
          </ul>
          {consent.data.non_ai_mode ? <Alert>{t("purposes.nonAi")}</Alert> : null}
        </>
      ) : null}
      {change.isError ? <Alert variant="destructive">{errorMessage(change.error)}</Alert> : null}
    </section>
  )
}
