"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, Input, Label, StateView, Textarea, safeHttpUrl } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { ShareFrame } from "../share/share-header"
import { fetchGuestView, sendGuestResponse, type GuestView } from "./api"
import { useGuestSession } from "./use-guest-session"

/** Mirrors the backend's rule for links a helper may attach: https only, at most this long. */
const URL_MAX = 2048

function isHttps(value: string): boolean {
  return value.startsWith("https://") && value.length <= URL_MAX && safeHttpUrl(value) !== null
}

function ResponseForm({
  session,
  name,
  onSent,
}: {
  session: string
  name: string | null
  onSent: (view: GuestView) => void
}) {
  const t = useT("share.admissionGuest")
  const errorMessage = useErrorMessage()
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [sent, setSent] = useState(false)
  const badUrl = url.trim() !== "" && !isHttps(url.trim())

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!text.trim() || badUrl) return
    setPending(true)
    setError(null)
    try {
      await sendGuestResponse(session, { text: text.trim(), url: url.trim() || null })
      onSent(await fetchGuestView(session))
      setText("")
      setUrl("")
      setSent(true)
    } catch (e) {
      setError(e)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="guest-text">{t("text")}</Label>
        <Textarea id="guest-text" value={text} onChange={(event) => setText(event.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="guest-url">{t("url")}</Label>
        <Input
          id="guest-url"
          type="url"
          inputMode="url"
          placeholder="https://"
          maxLength={URL_MAX}
          value={url}
          aria-invalid={badUrl}
          onChange={(event) => setUrl(event.target.value)}
        />
        {badUrl ? (
          <p role="alert" className="text-destructive text-sm">
            {t("urlInvalid")}
          </p>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(error)}
        </p>
      ) : null}
      {sent ? (
        <p role="status" className="text-sm">
          {t("thanks", { name: name ?? t("student") })}
        </p>
      ) : null}
      <Button type="submit" className="self-start" disabled={pending || !text.trim() || badUrl}>
        {t("send")}
      </Button>
    </form>
  )
}

function GuestBody({ session, view, onView }: { session: string; view: GuestView; onView: (view: GuestView) => void }) {
  const t = useT("share.admissionGuest")
  const fmt = useFormatters()
  return (
    <article className="bg-card rounded-card flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight break-words">
          {t("title", { name: view.first_name ?? t("student") })}
        </h1>
        <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{view.brief}</p>
        <p className="text-muted-foreground text-sm">
          {t("validUntil", { time: fmt.dateTime(new Date(view.expires_at)) })}
        </p>
      </header>
      <section aria-labelledby="guest-activities" className="flex flex-col gap-2">
        <h2 id="guest-activities" className="font-semibold">
          {t("activities")}
        </h2>
        <ul className="flex flex-col gap-2">
          {view.activities.map((activity, index) => (
            <li key={index} className="border-hairline rounded-card border p-3">
              <p className="font-medium">{activity.position}</p>
              <p className="text-muted-foreground text-sm">{activity.org}</p>
              <p className="text-sm">{activity.description}</p>
            </li>
          ))}
        </ul>
      </section>
      {view.responses.length > 0 ? (
        <section aria-labelledby="guest-responses" className="flex flex-col gap-2">
          <h2 id="guest-responses" className="font-semibold">
            {t("responses")}
          </h2>
          <ul className="flex flex-col gap-2">
            {view.responses.map((response) => {
              const href = safeHttpUrl(response.url)
              return (
                <li key={response.id} className="border-hairline rounded-card border p-3">
                  <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{response.text}</p>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-4 hover:underline"
                    >
                      {href}
                    </a>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
      <ResponseForm session={session} name={view.first_name} onSent={onView} />
      <p className="text-muted-foreground text-sm">{t("claimHint")}</p>
    </article>
  )
}

/** The page a guest helper opens from a link: exchanges the fragment token, shows the reduced activities, takes a reply. */
export function GuestViewer() {
  const t = useT("share.admissionGuest")
  const { state, setView } = useGuestSession()
  return (
    <ShareFrame>
      {state.kind === "loading" ? (
        <StateView state="loading" />
      ) : state.kind === "ready" ? (
        <GuestBody session={state.session} view={state.view} onView={setView} />
      ) : state.kind === "error" ? (
        <StateView state="error" error={state.error} />
      ) : (
        <StateView state="empty" title={t(`${state.kind}Title`)} description={t(`${state.kind}Text`)} />
      )}
    </ShareFrame>
  )
}
