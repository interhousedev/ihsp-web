"use client"

import type { HonourRule } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"

/** A rule, met or not; the marks that block it are listed under it. */
export function RuleRow({ rule }: { rule: HonourRule }) {
  const t = useT("honours")
  const key = `rules.${rule.rule}`
  const Icon = rule.passed ? Icons.check : Icons.close
  return (
    <li className="flex flex-col gap-1" data-testid={`honours-rule-${rule.rule}`}>
      <div className="flex items-start gap-2 text-sm">
        <Icon aria-hidden className={rule.passed ? "text-success mt-0.5 size-4" : "text-destructive mt-0.5 size-4"} />
        <span className="min-w-0 flex-1">{t.has(key) ? t(key) : t("unknownRule", { rule: rule.rule })}</span>
        <span className="text-muted-foreground text-xs">{t(rule.passed ? "rule.passed" : "rule.failed")}</span>
      </div>
      {rule.blocking.length === 0 ? null : (
        <div className="ps-6">
          <p className="text-muted-foreground text-xs">{t("blocking.title")}</p>
          <ul className="list-disc ps-4 text-sm">
            {rule.blocking.map((mark) => (
              <li key={`${mark.subject_id}-${mark.semester}-${mark.type}`}>
                {t("blocking.item", {
                  subject: mark.subject_name,
                  semester: mark.semester,
                  type: t(`types.${mark.type}`),
                  value: mark.value,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}
