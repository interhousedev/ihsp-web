"use client"

import { postLmsMediaRedeem, type MediaRedeem } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, PageContainer, safeHttpUrl } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"

type State = { kind: "loading" } | { kind: "denied" } | { kind: "ready"; media: MediaRedeem; src: string }

/** Takes the token out of the address at once, so it stays out of history and of what the page can leak. */
function takeToken(): string | null {
  const token = new URLSearchParams(window.location.hash.slice(1)).get("t")
  if (window.location.hash) window.history.replaceState(null, "", window.location.pathname)
  return token
}

/**
 * `/media/#t=<token>`: opens a media link issued through a connector. Public on purpose: the backend decides, by the
 * token and the session if there is one. A refusal shows nothing about the course.
 */
export function MediaPage({ readToken = takeToken }: { readToken?: () => string | null }) {
  const t = useT("media")
  const { status } = useSession()
  const [state, setState] = useState<State>({ kind: "loading" })
  const token = useRef<string | null | undefined>(undefined)
  const started = useRef(false)

  useEffect(() => {
    if (token.current === undefined) token.current = readToken()
    if (status === "loading" || state.kind !== "loading") return
    if (started.current) return // one request, also under the double effects of strict mode
    started.current = true
    const value = token.current
    if (!value) {
      setState({ kind: "denied" })
      return
    }
    postLmsMediaRedeem({ token: value }).then(
      (media) => {
        const src = safeHttpUrl(media.url)
        setState(src ? { kind: "ready", media, src } : { kind: "denied" })
      },
      () => setState({ kind: "denied" }),
    )
  }, [status, state.kind, readToken])

  if (state.kind === "denied") {
    return (
      <PageContainer title={t("title")}>
        <Alert variant="destructive">
          <AlertDescription>{t("notAvailable")}</AlertDescription>
        </Alert>
      </PageContainer>
    )
  }
  if (state.kind === "loading") {
    return (
      <PageContainer title={t("title")}>
        <p role="status">{t("loading")}</p>
      </PageContainer>
    )
  }
  return (
    <PageContainer title={state.media.title || t("title")}>
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- course media has no caption track */}
      <video src={state.src} controls playsInline className="w-full rounded-lg" />
      <p className="mt-3">
        <a href={state.src} target="_blank" rel="noopener noreferrer" className="underline">
          {t("open")}
        </a>
      </p>
    </PageContainer>
  )
}
