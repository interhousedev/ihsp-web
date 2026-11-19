"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Icons, Pill } from "@ihsp/ui"
import Link from "next/link"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { facetOf, optionLabel } from "../facets"
import { useFacets } from "../hooks"
import type { Institution } from "../types"
import { AddToListButton } from "./add-to-list-button"
import { useOptionLabel } from "./option-label"
import { formatCurrency } from "./money"
import { VerifiedBadge } from "./fact-source"

export function InstitutionCard({ institution }: { institution: Institution }) {
  const locale = useLocale()
  const t = useT("chooser")
  const aidLabel = useOptionLabel("aid")
  const countryLabel = useOptionLabel("country")
  const { facets } = useFacets()
  const policy = typeof institution.facts.test_policy?.value === "string" ? institution.facts.test_policy.value : null
  const policyLabel = policy ? optionLabel(facetOf(facets?.list, "test_policy"), policy) : null
  const place = [institution.city, countryLabel(institution.country)].filter(Boolean).join(", ")
  return (
    <article className="bg-card border-hairline-strong rounded-card flex min-w-0 flex-col gap-3 border p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <LogoAvatar
          name={institution.name}
          src={institution.logo_url}
          fit={institution.logo_fit}
          zoom={institution.logo_zoom}
          className="size-12 ring-0"
        />
        <div className="min-w-0 flex-1">
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
        {policyLabel ? (
          <li>
            <Pill>{policyLabel}</Pill>
          </li>
        ) : null}
        {institution.coa_total ? (
          <li>
            <Pill>
              <Icons.creditCard className="size-3.5" aria-hidden />
              {t("cost", {
                amount:
                  formatCurrency(institution.coa_total, institution.coa_currency, locale) ?? institution.coa_total,
              })}
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
