"use client"

import {
  getCertificateGroupsQuery,
  getCertificateTypesQuery,
  getStaffCertificatesQuery,
  postCertificateExport,
  type CertificateFilters,
} from "@ihsp/api"
import { ApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, StateView } from "@ihsp/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { CertificateFiltersBar } from "./certificate-filters"
import { CertificateRanking } from "./certificate-ranking"
import { CertificateStats } from "./certificate-stats"
import { CertificatesTable } from "./certificates-table"
import { saveBlob } from "./utils"

const PAGE_SIZE = 50

/**
 * Certificates for staff: filters, entries with file selection and "Download ZIP", stats per type and the ranking.
 * Admins see every group, curators only theirs; a teacher without a group gets `403` and a short notice.
 */
export function CertificatesStaffView() {
  const t = useT("certificates")
  const errorMessage = useErrorMessage()
  const [filters, setFilters] = useState<CertificateFilters>({})
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const types = useQuery(getCertificateTypesQuery())
  const groups = useQuery(getCertificateGroupsQuery())
  const entries = useQuery({
    ...getStaffCertificatesQuery({ ...filters, limit: PAGE_SIZE, offset }),
    placeholderData: (previous) => previous,
  })
  const exportZip = useMutation({
    mutationFn: (ids: string[]) => postCertificateExport(ids.length > 0 ? { file_ids: ids } : { filters }),
    onSuccess: (blob) => saveBlob(blob, "certificates.zip"),
    onError: (error) => toast.error(error instanceof ApiError ? errorMessage(error) : t("zipFailed")),
  })

  const forbidden = [groups.error, entries.error].some((error) => error instanceof ApiError && error.status === 403)
  if (forbidden) return <StateView state="empty" emptyText={t("forbidden")} />
  if (entries.isPending || groups.isPending || types.isPending) return <StateView state="loading" rows={4} />
  if (entries.isError) return <StateView state="error" error={entries.error} onRetry={() => void entries.refetch()} />

  const typeList = types.data ?? []
  const page = entries.data
  const changeFilters = (next: CertificateFilters) => {
    setFilters(next)
    setOffset(0)
    setSelected(new Set())
  }
  return (
    <div className="flex flex-col gap-6">
      <CertificateFiltersBar value={filters} onChange={changeFilters} groups={groups.data ?? []} types={typeList} />
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">{t("table.total", { count: page.total })}</p>
          <Button
            type="button"
            disabled={exportZip.isPending || page.total === 0}
            onClick={() => exportZip.mutate([...selected])}
          >
            {selected.size > 0 ? t("downloadZipSelected", { count: selected.size }) : t("downloadZip")}
          </Button>
        </div>
        {page.items.length === 0 ? (
          <StateView state="empty" emptyText={t("table.empty")} />
        ) : (
          <CertificatesTable items={page.items} types={typeList} selected={selected} onSelectedChange={setSelected} />
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            {t("table.previous")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={offset + PAGE_SIZE >= page.total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            {t("table.next")}
          </Button>
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("stats.title")}</h2>
        <CertificateStats filters={filters} types={typeList} />
      </section>
      <CertificateRanking filters={filters} />
    </div>
  )
}
