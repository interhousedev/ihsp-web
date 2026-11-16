"use client"

import { useT } from "@ihsp/i18n"
import { Icons, Pill } from "@ihsp/ui"
import Link from "next/link"
import type { Institution } from "../types"
import { AddToListButton } from "./add-to-list-button"
import { useOptionLabel } from "./option-label"
import { VerifiedBadge } from "./fact-source"

export function formatMoney(amount: string, currency: string | null): string {
  const number = Number(amount)
  const text = Number.isFinite(number) ? new Intl.NumberFormat().format(Math.round(number)) : amount
  return currency ? `${text} ${currency}` : text
}

export function InstitutionCard({ institution }: { institution: Institution }) {
  const t = useT("chooser")
  const aidLabel = useOptionLabel("aid")
  const place = [institution.city, institution.country].filter(Boolean).join(", ")
  return (
    <article className="bg-card border-hairline-strong rounded-card flex flex-col gap-3 border p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">
            <Link href={`/chooser/institution/?id=${encodeURIComponent(institution.id)}`} className="hover:underline">
              {institution.name}
            </Link>
          </h3>
          <p className="text-muted-foreground text-sm">{place}</p>
        </div>
        <VerifiedBadge verified={institution.verified} />
      </header>
      <ul className="flex flex-wrap gap-2">
        {institution.coa_total ? (
          <li>
            <Pill>
              <Icons.creditCard className="size-3.5" aria-hidden />
              {t("cost", { amount: formatMoney(institution.coa_total, institution.coa_currency) })}
            </Pill>
          </li>
        ) : null}
        {institution.aid_basis ? (
          <li>
            <Pill tone="primary">{aidLabel(institution.aid_basis)}</Pill>
          </li>
        ) : null}
        {institution.scholarship_count > 0 ? (
          <li>
            <Pill tone="success">{t("scholarshipCount", { count: institution.scholarship_count })}</Pill>
          </li>
        ) : null}
      </ul>
      <AddToListButton institutionId={institution.id} />
    </article>
  )
}
