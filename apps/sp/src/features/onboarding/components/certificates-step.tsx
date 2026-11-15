"use client"

import {
  getCertificateTypesQuery,
  getMyCertificatesQuery,
  keys,
  postOnboardingCertificatesDone,
  postOnboardingRefreshEmis,
  type CertificateEntry,
  type CertificateType,
} from "@ihsp/api"
import { typeName } from "@ihsp/features-core"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, IconPlus, StateView } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { CertificateEntryDialog } from "../../profile/components/certificate-entry-dialog"
import { CertificateEntryRow } from "../../profile/components/certificate-entry-row"

type Editing = { type: CertificateType; entry: CertificateEntry | null } | null

/**
 * The skippable certificates step. Entering it loads the National Certificate and CEFR from EMIS; a failed load is
 * explained and never blocks. "Done" and "Skip for now" both mark the step as seen.
 */
export function CertificatesStep() {
  const t = useT("onboarding")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const types = useQuery(getCertificateTypesQuery())
  const mine = useQuery(getMyCertificatesQuery())
  const [editing, setEditing] = useState<Editing>(null)

  const refresh = useMutation({
    mutationFn: () => postOnboardingRefreshEmis(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.certificates.mine() }),
  })
  const done = useMutation({
    mutationFn: postOnboardingCertificatesDone,
    onSuccess: (data) => queryClient.setQueryData(keys.me.onboarding(), data),
  })

  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    refresh.mutate()
  }, [refresh])

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">{t("certificates.intro")}</p>

      {refresh.isPending ? (
        <p role="status" className="text-muted-foreground text-sm">
          {t("certificates.loading")}
        </p>
      ) : refresh.isError ? (
        <div role="alert" className="flex flex-col items-start gap-2 text-sm">
          <p>{t("certificates.emisFailed", { reason: errorMessage(refresh.error) })}</p>
          <Button type="button" size="sm" variant="outline" className="min-h-11" onClick={() => refresh.mutate()}>
            {t("certificates.retry")}
          </Button>
        </div>
      ) : refresh.isSuccess ? (
        <p role="status" className="text-sm">
          {refresh.data.entries.length > 0
            ? t("certificates.loaded", { count: refresh.data.entries.length })
            : t("certificates.loadedNone")}
        </p>
      ) : null}

      {types.isPending || mine.isPending ? (
        <StateView state="loading" rows={2} />
      ) : types.isError || mine.isError ? (
        <StateView
          state="error"
          error={types.error ?? mine.error}
          onRetry={() => void Promise.all([types.refetch(), mine.refetch()])}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {types.data.map((type) => {
            const entries = mine.data.filter((entry) => entry.type_id === type.id)
            const name = typeName(type, locale)
            return (
              <section key={type.id} aria-label={name} className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{name}</h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-11"
                    aria-label={t("certificates.addEntry", { type: name })}
                    onClick={() => setEditing({ type, entry: null })}
                  >
                    <IconPlus aria-hidden /> {t("certificates.add")}
                  </Button>
                </div>
                {entries.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t("certificates.empty")}</p>
                ) : (
                  <ul className="divide-y">
                    {entries.map((entry) => (
                      <CertificateEntryRow key={entry.id} entry={entry} onEdit={() => setEditing({ type, entry })} />
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button type="button" className="min-h-11" disabled={done.isPending} onClick={() => done.mutate()}>
          {done.isPending ? t("certificates.saving") : t("certificates.done")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={done.isPending}
          onClick={() => done.mutate()}
        >
          {t("certificates.skip")}
        </Button>
        {done.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(done.error)}
          </p>
        ) : null}
      </div>

      {editing ? (
        <CertificateEntryDialog
          key={editing.entry?.id ?? `new-${editing.type.id}`}
          type={editing.type}
          entry={editing.entry}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  )
}
