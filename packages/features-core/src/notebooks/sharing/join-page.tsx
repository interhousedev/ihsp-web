"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, Skeleton, StateView } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type JoinPageProps = {
  /** Sends the token to the backend and returns where to go next. */
  join: (token: string) => Promise<string>
}

/** Opens a share link. The token is read from the fragment, so it never reaches a server log or a referrer. */
export function JoinSharePage({ join }: JoinPageProps) {
  const t = useT("notebooks.share")
  const router = useRouter()
  const [failed, setFailed] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const token = window.location.hash.slice(1)
    window.history.replaceState(null, "", window.location.pathname)
    if (token === "") {
      setFailed(true)
      return
    }
    join(token).then(
      (href) => router.replace(href),
      () => setFailed(true),
    )
  }, [join, router])

  return (
    <PageContainer title={t("joinTitle")}>
      {failed ? (
        <StateView state="empty" emptyText={t("joinFailed")} />
      ) : (
        <Skeleton className="h-32 w-full rounded-xl" />
      )}
    </PageContainer>
  )
}
