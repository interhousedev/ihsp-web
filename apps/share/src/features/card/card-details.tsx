"use client"

import type { PublicStudentCard } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import type { ReactNode } from "react"

type Locale = keyof NonNullable<PublicStudentCard["lyceum_name"]>

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-base font-medium break-words">{value}</dd>
    </div>
  )
}

/** Lyceum, group, course, direction and speciality; empty values are left out. */
export function CardDetails({ card }: { card: PublicStudentCard }) {
  const t = useT("share.card")
  const locale = useLocale() as Locale
  const lyceum = card.lyceum_name ? (card.lyceum_name[locale] ?? card.lyceum_name.en) : null
  const rows: [string, ReactNode][] = [
    [t("lyceum"), lyceum],
    [t("group"), card.group],
    [t("course"), card.course],
    [t("direction"), card.direction],
    [t("speciality"), card.speciality],
  ]
  return (
    <dl className="grid w-full gap-4 sm:grid-cols-2">
      {rows.map(([label, value]) =>
        value === null || value === "" ? null : <Row key={label} label={label} value={value} />,
      )}
    </dl>
  )
}
