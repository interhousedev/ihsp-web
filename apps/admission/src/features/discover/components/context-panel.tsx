"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, Icons } from "@ihsp/ui"
import Link from "next/link"
import type { AdmissionMatch as Match } from "@ihsp/api"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { StatusPill } from "./status-pill"

export function ContextPanel({ match }: { match: Match | undefined }) {
  const t = useT("discover")
  if (!match) return <p className="text-muted-foreground text-sm">{t("context.empty")}</p>
  return (
        <LogoAvatar name={match.name} src={match.logo_url} className="size-10 ring-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{match.name}</p>
        </div>
        {match.status ? <StatusPill status={match.status} /> : null}
      </div>
        ))}
    </div>
  )
}
