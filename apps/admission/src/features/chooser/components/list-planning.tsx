"use client"

import { getApiClient } from "@ihsp/api"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, Pill, StateView } from "@ihsp/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useList } from "../hooks"
import { AddToListButton } from "./add-to-list-button"
import { useOptionLabel } from "./option-label"

type Insights = {
  entries: {
    entry_id: string
    institution_id: string
    classification: { effective: string | null; source: string; reasons: string[] }
  }[]
  balance: { reach: number; target: number; safety: number; unlabelled: number; status: string }
}
type Suggestion = { institution_id: string; name: string; country: string; label: string; reason: string }

/** Explain the computed list balance and offer consent-gated AI additions, never auto-adding them. */
export function ListPlanning() {
  const t = useT("chooser")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const label = useOptionLabel("bucket")
  const country = useOptionLabel("country")
  const list = useList()
  const insights = useQuery({
    queryKey: ["admission", "list-insights", list.data],
    queryFn: () => getApiClient().get<Insights>("/v1/admission/list/insights"),
  })
  const suggest = useMutation({
    mutationFn: () =>
      getApiClient().post<{ items: Suggestion[] }>("/v1/admission/list/suggest", undefined, {
        headers: { "Accept-Language": locale },
      }),
  })
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-lg border p-4" aria-label={t("planning.title")}>
      <h2 className="font-semibold">{t("planning.title")}</h2>
      {insights.isPending ? (
        <StateView state="loading" rows={1} />
      ) : insights.isError ? (
        <StateView state="error" error={insights.error} onRetry={() => void insights.refetch()} />
      ) : (
        <>
          <p className="text-sm">{t(`planning.balance.${insights.data.balance.status}`)}</p>
          <div className="flex flex-wrap gap-2">
            {(["reach", "target", "safety"] as const).map((key) => (
              <Pill key={key}>
                {label(key)}: {insights.data.balance[key]}
              </Pill>
            ))}
          </div>
          <ul className="flex flex-col gap-2">
            {insights.data.entries.map((entry) => {
              const institution = list.data?.find((item) => item.id === entry.entry_id)?.institution
              return (
                <li key={entry.entry_id} className="text-sm">
                  <span className="font-medium">{institution?.name}</span>
                  {" · "}
                  {entry.classification.effective ? label(entry.classification.effective) : t("list.noBucket")}
                  <span className="text-muted-foreground">{` · ${t(`planning.source.${entry.classification.source}`)}`}</span>
                </li>
              )
            })}
          </ul>
        </>
      )}
      <Button variant="outline" disabled={suggest.isPending} onClick={() => suggest.mutate()}>
        {t("planning.suggest")}
      </Button>
      {suggest.isPending ? <StateView state="loading" rows={2} /> : null}
      {suggest.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(suggest.error)}
        </p>
      ) : null}
      {suggest.data ? (
        suggest.data.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("planning.noSuggestions")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {suggest.data.items.map((item) => (
              <li key={item.institution_id} className="flex min-w-0 flex-col gap-2 rounded-lg border p-3">
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground text-xs">
                  {country(item.country)} · {label(item.label)}
                </p>
                <p className="text-sm">{item.reason}</p>
                <AddToListButton institutionId={item.institution_id} />
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  )
}
