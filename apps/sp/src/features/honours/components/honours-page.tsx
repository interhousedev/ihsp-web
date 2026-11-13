"use client"

import { getMeHonoursQuery } from "@ihsp/api"
import { BackLink, QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { AwardCard } from "./award-card"
import { SerialNote } from "./serial-note"

/** Red diploma and medals: one card per award with the rules and the marks that stand in the way. */
export function HonoursPage() {
  const t = useT("honours")
  const query = useQuery(getMeHonoursQuery())
  return (
    <PageContainer title={t("title")} width="narrow" back={<BackLink href="/grades/" label={t("back")} />}>
      <QueryState query={query} isEmpty={(data) => data.awards.length === 0} emptyText={t("empty")} rows={3}>
        {(data) => (
          <div className="flex flex-col gap-4">
            <SerialNote serial={data.school_certificate_serial} />
            {data.awards.map((award) => (
              <AwardCard key={award.kind} award={award} />
            ))}
          </div>
        )}
      </QueryState>
    </PageContainer>
  )
}
