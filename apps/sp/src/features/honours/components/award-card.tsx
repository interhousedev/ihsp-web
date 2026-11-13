"use client"

import type { HonourAward } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, cn } from "@ihsp/ui"
import { RuleRow } from "./rule-row"

/** One award, eligible or not, with every rule it is made of. */
export function AwardCard({ award }: { award: HonourAward }) {
  const t = useT("honours")
  return (
    <section aria-labelledby={`honours-award-title-${award.kind}`} data-testid={`honours-award-${award.kind}`}>
      <Card size="sm">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id={`honours-award-title-${award.kind}`} className="text-base font-semibold">
              {t(`awards.${award.kind}`)}
            </h2>
            <Badge
              variant="outline"
              className={cn(
                award.eligible
                  ? "border-success bg-success-muted text-success"
                  : "border-destructive bg-destructive-muted text-destructive",
              )}
            >
              {t(award.eligible ? "status.eligible" : "status.blocked")}
            </Badge>
          </div>
          <ul className="flex flex-col gap-3">
            {award.rules.map((rule) => (
              <RuleRow key={rule.rule} rule={rule} />
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}
