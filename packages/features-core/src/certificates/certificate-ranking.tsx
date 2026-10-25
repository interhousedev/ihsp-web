"use client"

import { getCertificateRankingQuery, type CertificateFilters } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Card, CardContent, CardHeader, CardTitle, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"

/** The students with the most certificates under the current filters. */
export function CertificateRanking({ filters }: { filters: CertificateFilters }) {
  const t = useT("certificates.ranking")
  const query = useQuery(getCertificateRankingQuery({ ...filters, limit: 20 }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {query.isPending ? (
          <StateView state="loading" rows={3} />
        ) : query.isError ? (
          <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
        ) : query.data.items.length === 0 ? (
          <StateView state="empty" emptyText={t("empty")} />
        ) : (
          <ol className="divide-y">
            {query.data.items.map((item, index) => (
              <li key={item.student_id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="text-muted-foreground mr-2 tabular-nums">{index + 1}.</span>
                  <span className="font-medium">{item.name}</span>
                  {item.group_name ? <span className="text-muted-foreground ml-2">{item.group_name}</span> : null}
                </span>
                <span className="font-semibold tabular-nums">{t("count", { count: item.count })}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
