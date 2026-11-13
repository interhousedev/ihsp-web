"use client"

import { getPublicStudentCardQuery, isApiError, publicStudentCardPhotoPath, type PublicStudentCard } from "@ihsp/api"
import { BRAND } from "@ihsp/config/brand"
import { getConfig } from "@ihsp/config"
import { useFormatters, useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { ShareFrame } from "../share/share-header"
import { CardDetails } from "./card-details"
import { CardExpired, CardLoading } from "./card-states"
import { formatCountdown, useSecondsLeft } from "./use-countdown"

function CardBody({ card, token }: { card: PublicStudentCard; token: string }) {
  const t = useT("share.card")
  const f = useFormatters()
  const left = useSecondsLeft(card.expires_at)
  if (left === 0) return <CardExpired />
  return (
    <article className="bg-card rounded-card flex flex-col items-center gap-6 p-6 text-center">
      {card.has_photo ? (
        // oxlint-disable-next-line nextjs/no-img-element -- static export; the photo is an authless API image
        <img
          src={`${getConfig().API_URL}${publicStudentCardPhotoPath(token)}`}
          alt=""
          width={160}
          height={160}
          className="size-40 rounded-full object-cover"
        />
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight break-words">
        {card.first_name} {card.last_name}
      </h1>
      <CardDetails card={card} />
      <p className="text-muted-foreground text-sm" role="timer">
        {t("validUntil", { time: f.date(card.expires_at, { hour: "2-digit", minute: "2-digit", second: "2-digit" }) })}
        {" · "}
        {t("expiresIn", { time: formatCountdown(left) })}
      </p>
    </article>
  )
}

function CardContent({ token }: { token: string | null }) {
  const query = useQuery({ ...getPublicStudentCardQuery(token ?? ""), enabled: Boolean(token), retry: false })
  if (!token) return <CardExpired />
  if (query.isPending) return <CardLoading />
  if (query.isError) {
    if (isApiError(query.error) && query.error.status === 404) return <CardExpired />
    return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  }
  return <CardBody card={query.data as PublicStudentCard} token={token} />
}

/** The public student card: reads `?t=`, fetches the card without login, counts down to its expiry. */
export function CardViewer() {
  const token = useSearchParams().get("t")
  return (
    <ShareFrame>
      <div className="flex items-center justify-center gap-2">
        {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file of /public */}
        <img src="/ai/icons/logo.svg" alt="" width={28} height={28} className="rounded-md" />
        <span className="text-lg font-semibold tracking-tight">{BRAND.apps.sp.name}</span>
      </div>
      <CardContent token={token} />
    </ShareFrame>
  )
}
