"use client"

import { getAdminWorkOffStatsQuery, type WorkOffGroupBy } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"

/** Open and done counts per key, the most open first; a row opens the drill-down. */
export function WorkOffStatsTable({
  by,
  from,
  to,
  onOpen,
}: {
  by: WorkOffGroupBy
  from: string
  to: string
  onOpen: (key: string, name: string) => void
}) {
  const t = useT("workOffs")
  const query = useQuery({ ...getAdminWorkOffStatsQuery({ from, to, group_by: by }), placeholderData: (p) => p })
  return (
    <QueryState query={query} rows={4} isEmpty={(stats) => stats.rows.length === 0} emptyText={t("empty")}>
      {(stats) => (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm">{t("totalOpen", { count: stats.total_open })}</p>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(`labels.${by}`)}</TableHead>
                  <TableHead className="text-end">{t("open")}</TableHead>
                  <TableHead className="text-end">{t("done")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.rows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto min-h-11 px-0 md:min-h-7"
                        onClick={() => onOpen(row.key, row.name)}
                      >
                        {row.name}
                      </Button>
                    </TableCell>
                    <TableCell className="text-end tabular-nums">{row.open_count}</TableCell>
                    <TableCell className="text-end tabular-nums">{row.done_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </QueryState>
  )
}
