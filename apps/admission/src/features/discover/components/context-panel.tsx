"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, Icons } from "@ihsp/ui"
import Link from "next/link"
import type { AdmissionMatch as Match } from "@ihsp/api"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { usd } from "../format"
import { StatusPill } from "./status-pill"

/** The college on top of the deck with shortcuts for what to ask or do next. */
export function ContextPanel({ match }: { match: Match | undefined }) {
  const t = useT("discover")
  if (!match) return <p className="text-muted-foreground text-sm">{t("context.empty")}</p>
  const href = (extra = "") => `/chooser/institution/?id=${encodeURIComponent(match.university_id)}${extra}`
  const actions = [
    { key: "open", href: href(), icon: Icons.externalLink },
    { key: "chances", href: href("&tab=chances"), icon: Icons.target },
    { key: "scholarships", href: href("&tab=cost"), icon: Icons.sparkles },
  ] as const
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs font-medium uppercase">{t("context.title")}</p>
      <div className="bg-card border-hairline-strong rounded-card flex items-center gap-3 border p-3">
        <LogoAvatar name={match.name} src={match.logo_url} className="size-10 ring-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{match.name}</p>
          <p className="text-muted-foreground truncate text-xs">
            {match.cost_after_aid_usd === null
              ? match.city
              : t("context.perYear", { amount: usd(match.cost_after_aid_usd) })}
          </p>
        </div>
        {match.status ? <StatusPill status={match.status} /> : null}
      </div>
      <p className="text-sm">{t("context.hint")}</p>
      <ul className="grid grid-cols-2 gap-2">
        {actions.map(({ key, href: to, icon: Icon }) => (
          <li key={key} className="min-w-0">
            <Link
              href={to}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "h-auto min-h-8 w-full justify-start px-3 py-1.5 text-left leading-tight whitespace-normal",
              })}
            >
              <Icon aria-hidden className="shrink-0" />
              <span className="min-w-0 break-words">{t(`context.actions.${key}`)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
