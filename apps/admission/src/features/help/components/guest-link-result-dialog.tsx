"use client"

import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { AnimatedPresence, Alert, AlertDescription, Button, Icons, QrCode, Reveal, ResponsiveDialog } from "@ihsp/ui"
import { useState } from "react"
import type { CreatedGuestLink } from "../api"

/** The guest page; the token rides in the fragment, which browsers never send to a server. */
export function guestUrl(token: string): string {
  return `${getConfig().SHARE_URL.replace(/\/+$/, "")}/admission-guest/#${token}`
}

/** Shows a freshly created or rotated guest link once: the token cannot be fetched again. */
export function GuestLinkResultDialog({ created, onClose }: { created: CreatedGuestLink | null; onClose: () => void }) {
  const t = useT("help")
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const url = created ? guestUrl(created.token) : ""

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setFailed(false)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setFailed(true)
    }
  }

  return (
    <ResponsiveDialog
      open={created !== null}
      onOpenChange={(open) => {
        if (!open) {
          setCopied(false)
          onClose()
        }
      }}
      title={t("link.createdTitle")}
      disablePointerDismissal
      footer={
        <Button type="button" onClick={onClose}>
          {t("link.done")}
        </Button>
      }
    >
      <Alert>
        <Icons.lock aria-hidden />
        <AlertDescription>{t("link.shownOnce")}</AlertDescription>
      </Alert>
      <div className="flex items-center gap-2">
        <input
          readOnly
          aria-label={t("link.urlLabel")}
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="border-hairline-strong bg-muted/40 min-h-11 min-w-0 flex-1 rounded-card border px-3 font-mono text-xs md:min-h-9"
        />
        <Button type="button" onClick={copy} className="min-h-11 md:min-h-9" aria-live="polite">
          <AnimatedPresence mode="wait">
            <Reveal key={copied ? "done" : "copy"} className="inline-flex items-center gap-1.5">
              {copied ? <Icons.check aria-hidden /> : <Icons.copy aria-hidden />}
              {copied ? t("link.copiedShort") : t("link.copy")}
            </Reveal>
          </AnimatedPresence>
        </Button>
      </div>
      {failed ? (
        <p role="alert" className="text-destructive text-sm">
          {t("link.copyFailed")}
        </p>
      ) : null}
      <div className="flex justify-center">
        <QrCode value={url} label={t("link.qr")} />
      </div>
    </ResponsiveDialog>
  )
}
