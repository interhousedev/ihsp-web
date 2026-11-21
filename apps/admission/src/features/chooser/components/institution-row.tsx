"use client"

import { formatDate, useLocale, useT } from "@ihsp/i18n"
import Link from "next/link"
import { FitRingButton } from "../../fit/components/fit-ring-button"
import { totalFit } from "../../fit/fit-model"
import { RingLogo } from "../../fit/components/ring-logo"
import { percent } from "../../discover/format"
import type { Institution } from "../types"
import type { ListRow } from "../use-list-rows"
import { AddToListButton } from "./add-to-list-button"
import { VerifiedBadge } from "./fact-source"
import { formatCompactCurrency } from "./money"
import { useOptionLabel } from "./option-label"

/** One university of the catalog as a compact row like the list's: fit ring (the list's breakdown when it is on my list, else the catalog's total), name, ≈ cost, intl admit, deadline, add. */
export function InstitutionRow({ institution, row }: { institution: Institution; row?: ListRow }) {
  const t = useT("uniList")
  const locale = useLocale()
  const countryLabel = useOptionLabel("country")
  const name = institution.name
  const cost =
    row?.cost ??
    (institution.cost_after_aid
      ? {
          amount: Number(institution.cost_after_aid),
          currency: institution.coa_currency ?? "USD",
          kind: "net" as const,
        }
      : null)
  const intl = institution.facts.intl_acceptance_rate?.value ?? institution.facts.acceptance_rate?.value
  const summary = [
    cost && Number.isFinite(cost.amount)
      ? cost.kind === "net"
        ? t("approx", { amount: formatCompactCurrency(cost.amount, cost.currency, locale) })
        : formatCompactCurrency(cost.amount, cost.currency, locale)
      : null,
    typeof intl === "number" ? percent(intl) : null,
    institution.next_deadline ? formatDate(institution.next_deadline) : null,
  ]
    .filter(Boolean)
    .join(" · ")
  const fit =
    row?.fit ?? (institution.fit_total == null ? null : totalFit(institution.fit_total, institution.known_share))
  const logo = <RingLogo name={name} src={institution.logo_url} />
  return (
    <div className="flex min-w-0 items-center gap-3 border-b py-2.5">
      {fit ? (
        <FitRingButton name={name} fit={fit} size={44}>
          {logo}
        </FitRingButton>
      ) : (
        <div className="size-11 shrink-0">{logo}</div>
      )}
      <div className="min-w-0 flex-1">
        <Link
          href={`/chooser/institution/?id=${encodeURIComponent(institution.id)}`}
          className="line-clamp-1 text-sm leading-snug font-medium hover:underline"
        >
          {name}
        </Link>
        <p className="text-muted-foreground truncate text-xs">
          {[institution.city, countryLabel(institution.country)].filter(Boolean).join(", ")}
        </p>
        {summary ? <p className="text-muted-foreground truncate text-xs tabular-nums">{summary}</p> : null}
      </div>
      <div className="hidden sm:block">
        <VerifiedBadge verified={institution.verified} />
      </div>
      <AddToListButton institutionId={institution.id} compact />
    </div>
  )
}
