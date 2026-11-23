"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import Link from "next/link"

export type XpChipProps = {
  xp: number
  level: number
  /** When set, the chip is a link (the header points it to `/my/`). */
  href?: string
  className?: string
}

/** A compact "Lv 3 · 450 XP" pill for headers and cards. */
export function XpChip({ xp, level, href, className }: XpChipProps) {
  const t = useT("engagement")
  const label = t("xpChip", { level, xp })
  const body = (
    <>
      <span aria-hidden className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs font-bold">
        {level}
      </span>
      <span className="tabular-nums">{t("xp", { xp })}</span>
    </>
  )
  const classes = cn(
    "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2 text-sm font-medium",
    href && "hover:bg-muted min-h-11 md:min-h-8",
    className,
  )
  return href ? (
    <Link href={href} aria-label={label} title={label} className={classes} data-testid="xp-chip">
      {body}
    </Link>
  ) : (
    <span role="img" aria-label={label} title={label} className={classes} data-testid="xp-chip">
      {body}
    </span>
  )
}
