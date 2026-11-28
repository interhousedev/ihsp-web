"use client"

import { useT } from "@ihsp/i18n"
import { Button, Input, Label, Textarea } from "@ihsp/ui"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { publicClubsApi } from "./public-clubs-api"

const MAX = 2000

/** Contact-the-founder form: name, email, message, captcha and a honeypot. The email is never shown publicly. */
export function ContactFounderForm({ slug, club, captchaKey }: { slug: string; club: string; captchaKey: string }) {
  const t = useT("clubsPublic.contact")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState<"failed" | "unavailable" | null>(null)
  const [token, setToken] = useState(captchaKey ? "" : "dev-captcha")
  const widget = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!captchaKey || sent || !widget.current) return
    const w = window as unknown as {
      turnstile?: { render: (el: HTMLElement, o: object) => string; remove: (id: string) => void }
    }
    let id: string | undefined
    const mount = () => {
      if (widget.current && w.turnstile && id === undefined)
        id = w.turnstile.render(widget.current, {
          sitekey: captchaKey,
          callback: setToken,
          "expired-callback": () => setToken(""),
          "error-callback": () => setToken(""),
        })
    }
    if (w.turnstile) mount()
    else {
      let s = document.querySelector<HTMLScriptElement>("script[data-turnstile]")
      if (!s) {
        s = document.createElement("script")
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        s.async = true
        s.dataset.turnstile = "1"
        document.head.appendChild(s)
      }
      s.addEventListener("load", mount)
    }
    return () => {
      if (id !== undefined) w.turnstile?.remove(id)
    }
  }, [captchaKey, sent])

  if (sent) {
    return (
      <div role="status" className="rounded-card border p-4">
        <p className="font-semibold">{t("sentTitle")}</p>
        <p className="text-muted-foreground mt-1 text-sm">{t("sentBody", { club })}</p>
      </div>
    )
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget as HTMLFormElement)
    const field = (k: string) => String(data.get(k) ?? "")
    setBusy(true)
    setFailed(null)
    publicClubsApi
      .contact(slug, {
        name: field("name"),
        email: field("email"),
        message: field("message"),
        website: field("website") || null,
        captcha_token: token,
      })
      .then(() => setSent(true))
      .catch((err: { status?: number }) =>
        setFailed(err.status === 409 || err.status === 404 ? "unavailable" : "failed"),
      )
      .finally(() => setBusy(false))
  }
  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="cf-name">{t("name")}</Label>
        <Input id="cf-name" name="name" required autoComplete="name" className="h-11 w-full" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="cf-email">{t("email")}</Label>
        <Input id="cf-email" name="email" type="email" required autoComplete="email" className="h-11 w-full" />
        <p className="text-muted-foreground text-xs">{t("emailHint")}</p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="cf-message">{t("message")}</Label>
        <Textarea
          id="cf-message"
          name="message"
          rows={5}
          required
          maxLength={MAX}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="text-muted-foreground text-right text-xs tabular-nums">
          {message.length} / {MAX}
        </p>
      </div>
      {/* Honeypot: hidden from people; a bot that fills it is dropped by the server. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {failed ? (
        <p role="alert" className="text-destructive text-sm">
          {t(failed)}
        </p>
      ) : null}
      {captchaKey ? <div ref={widget} /> : null}
      <Button type="submit" disabled={busy || !token}>
        {t("send")}
      </Button>
    </form>
  )
}
