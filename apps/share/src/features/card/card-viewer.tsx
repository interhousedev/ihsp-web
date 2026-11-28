"use client"

import { isApiError } from "@ihsp/api"
import { StateView } from "@ihsp/ui"
import { useSearchParams } from "next/navigation"
import { ShareFrame } from "../share/share-header"
import { CardFace } from "./card-face"
import { CardInvalid, CardLoading } from "./card-states"
import { usePublicCard } from "./use-public-card"

function CardContent({ token }: { token: string | null }) {
  const query = usePublicCard(token)
  if (!token) return <CardInvalid />
  if (query.isPending) return <CardLoading />
  if (query.isError) {
    if (isApiError(query.error) && query.error.status === 404) return <CardInvalid />
    return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  }
  return <CardFace card={query.data} token={token} />
}

/** The public student card: reads `?t=` (the student's permanent QR token) and shows the card without login. */
export function CardViewer() {
  const token = useSearchParams().get("t")
  return (
    <ShareFrame>
      <CardContent token={token} />
    </ShareFrame>
  )
}
