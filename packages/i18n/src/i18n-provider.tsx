"use client"

import { BootSplash } from "@ihsp/config"
import { NextIntlClientProvider } from "next-intl"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useLocaleStore } from "./locale-store"
import { TIME_ZONE, type Locale } from "./locales"
import { loadMessages, type MessageLoader, type Messages } from "./messages"

export type AppName = "id" | "sp" | "staff" | "admin" | "lms" | "share"

type Loaded = { locale: Locale; messages: Messages }

function handleError(error: { code?: string; message: string }): void {
  // Missing keys are a development problem; the visible fallback is the key itself.
  if (process.env.NODE_ENV !== "production") console.warn(`[i18n] ${error.message}`)
}

function messageFallback({ namespace, key }: { namespace?: string; key: string }): string {
  return namespace ? `${namespace}.${key}` : key
}

function MessagesFailed() {
  return (
    <div role="alert" style={{ display: "grid", minHeight: "100dvh", placeItems: "center", padding: 16 }}>
      <p style={{ margin: 0, textAlign: "center" }}>
        The page could not be loaded.{" "}
        <button type="button" onClick={() => window.location.reload()} style={{ textDecoration: "underline" }}>
          Reload
        </button>
      </p>
    </div>
  )
}

/**
 * Client-side next-intl provider without locale routing. The locale comes from the account preference, then
 * `localStorage`, then the browser, then `ru`. Messages are the shared ones plus the app's own (`loadMessages`).
 * Only the boot spinner shows until the messages of the active locale are loaded, so there is no flash of message keys.
 */
export function I18nProvider({
  app,
  loadMessages: appLoader,
  children,
}: {
  app: AppName
  /** `(locale) => import(`../../messages/${locale}.json`)` from the app (the path must be literal for the bundler). */
  loadMessages?: MessageLoader
  children: ReactNode
}) {
  const locale = useLocaleStore((state) => state.locale)
  const resolved = useLocaleStore((state) => state.resolved)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [failed, setFailed] = useState(false)
  // Apps pass a module-level loader; a ref keeps an inline function from restarting the effect on every render.
  const loaderRef = useRef(appLoader)
  useEffect(() => {
    loaderRef.current = appLoader
  }, [appLoader])

  useEffect(() => {
    useLocaleStore.getState().resolve()
  }, [])

  useEffect(() => {
    if (!resolved) return
    let cancelled = false
    loadMessages(locale, loaderRef.current).then(
      (messages) => {
        if (cancelled) return
        setFailed(false)
        setLoaded({ locale, messages })
      },
      (error: unknown) => {
        console.error(`[i18n] could not load messages (${app}, ${locale})`, error)
        if (!cancelled) setFailed(true)
      },
    )
    return () => {
      cancelled = true
    }
  }, [app, locale, resolved])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  // Until the messages exist: the same spinner as the static HTML and the app's own loading states. A failed load
  // (stale chunk after a deployment, offline) must not leave a blank page: offer a reload in plain words.
  if (!loaded) return failed ? <MessagesFailed /> : <BootSplash />

  return (
    <NextIntlClientProvider
      locale={loaded.locale}
      messages={loaded.messages}
      timeZone={TIME_ZONE}
      onError={handleError}
      getMessageFallback={messageFallback}
    >
      {children}
    </NextIntlClientProvider>
  )
}
