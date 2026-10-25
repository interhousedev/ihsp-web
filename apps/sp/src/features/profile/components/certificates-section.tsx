"use client"

import {
  getCertificateTypesQuery,
  getMyCertificatesQuery,
  keys,
  postImportCertificatesFromEmis,
  type CertificateEntry,
  type CertificateType,
} from "@ihsp/api"
import { typeName } from "@ihsp/features-core"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, IconPlus, StateView } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { CertificateEntryDialog } from "./certificate-entry-dialog"
import { CertificateEntryRow } from "./certificate-entry-row"
import { ProfileCard } from "./profile-card"

type Editing = { type: CertificateType; entry: CertificateEntry | null } | null

/** The student's certificates, per type; "Load ... from EMIS" imports the National Certificate and CEFR. */
export function CertificatesSection() {
  const t = useT("certificates")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const types = useQuery(getCertificateTypesQuery())
  const mine = useQuery(getMyCertificatesQuery())
  const [editing, setEditing] = useState<Editing>(null)
  const [result, setResult] = useState<string | null>(null)
  const importEmis = useMutation({
    mutationFn: postImportCertificatesFromEmis,
    onSuccess: async (data) => {
      setResult(t("importResult", data))
      await queryClient.invalidateQueries({ queryKey: keys.certificates.mine() })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <section aria-labelledby="certificates-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="certificates-title" className="text-xl font-semibold">
          {t("title")}
        </h2>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 md:min-h-8"
          disabled={importEmis.isPending}
          onClick={() => importEmis.mutate()}
        >
          {importEmis.isPending ? t("importing") : t("importEmis")}
        </Button>
      </div>
      {result ? (
        <p role="status" className="text-sm">
          {result}
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {types.data.map((type) => {
            const entries = mine.data.filter((entry) => entry.type_id === type.id)
            return (
              <ProfileCard
                key={type.id}
                title={typeName(type, locale)}
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-11 md:min-h-8"
                    aria-label={t("addEntry", { type: typeName(type, locale) })}
                    onClick={() => setEditing({ type, entry: null })}
                  >
                    <IconPlus aria-hidden /> {t("add")}
                  </Button>
                }
              >
                {entries.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t("empty")}</p>
                ) : (
                  <ul className="divide-y">
                    {entries.map((entry) => (
                      <CertificateEntryRow key={entry.id} entry={entry} onEdit={() => setEditing({ type, entry })} />
                    ))}
                  </ul>
                )}
              </ProfileCard>
            )
          })}
        </div>
      )}
      {editing ? (
        <CertificateEntryDialog
          key={editing.entry?.id ?? `new-${editing.type.id}`}
          type={editing.type}
          entry={editing.entry}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  )
}
