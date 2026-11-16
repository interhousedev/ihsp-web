"use client"

import { formatDate, useT } from "@ihsp/i18n"
import { AnimatedPresence, Pill, Reveal } from "@ihsp/ui"
import Link from "next/link"
import type { CaseloadItem } from "../api"

/** One row per student; `limited` marks a student the caller sees only partly. */
export function CaseloadList({ items, stageLabel }: { items: CaseloadItem[]; stageLabel: (stage: string) => string }) {
  const t = useT("staff")
  return (
    <div role="list" aria-label={t("caseload.listLabel")} className="flex flex-col gap-2">
      <AnimatedPresence>
        {items.map((item) => (
          <Reveal key={item.student_id} role="listitem">
            <Link
              href={`/staff/students/view/?id=${item.student_id}`}
              className="hover:bg-muted/50 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition-colors"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-sm font-medium">
                  {item.student_name ?? t("caseload.student", { id: item.student_id.slice(0, 8) })} ·{" "}
                  {item.group_name ?? t("caseload.noGroup")}
                </span>
                <span className="text-muted-foreground text-xs">
                  {item.next_due
                    ? t("caseload.nextDue", { date: formatDate(item.next_due) })
                    : t("caseload.noDeadline")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {item.stage ? <Pill tone="primary">{stageLabel(item.stage)}</Pill> : null}
                {item.overdue > 0 ? <Pill tone="danger">{t("caseload.overdue", { count: item.overdue })}</Pill> : null}
                {item.open_help > 0 ? (
                  <Pill tone="warning">{t("caseload.help", { count: item.open_help })}</Pill>
                ) : null}
                {item.limited ? <Pill>{t("caseload.limited")}</Pill> : null}
              </div>
            </Link>
          </Reveal>
        ))}
      </AnimatedPresence>
    </div>
  )
}
