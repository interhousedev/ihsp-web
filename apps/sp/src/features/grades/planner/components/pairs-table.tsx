"use client"

import type { PlannerTarget } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { MarkBadge, Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@ihsp/ui"

/** "Midterm mark → lowest final": what the final has to be for each mark on the remaining midterms. */
export function PairsTable({ pairs }: { pairs: PlannerTarget["pairs"] }) {
  const t = useT("planner.target.pairs")
  return (
    <Table>
      <TableCaption className="sr-only">{t("caption")}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="text-center">{t("midterm")}</TableHead>
          <TableHead className="text-center">{t("final")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pairs.map((pair) => (
          <TableRow key={pair.midterm}>
            <TableCell className="text-center">
              <MarkBadge mark={pair.midterm} />
            </TableCell>
            <TableCell className="text-center">
              {pair.min_final === null ? (
                <span className="text-muted-foreground text-sm">{t("notReachable")}</span>
              ) : (
                <MarkBadge mark={pair.min_final} />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
