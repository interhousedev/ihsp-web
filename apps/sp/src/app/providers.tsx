"use client"

import { ErrorTrackingInit } from "@ihsp/features-core/telemetry"
import { AuthProvider, TelegramAutoLogin } from "@ihsp/auth"
import { ConfigGate } from "@ihsp/config"
import { ThemePreferenceSync } from "@ihsp/features-core"
import { I18nProvider, mergeMessages, type Locale, type Messages } from "@ihsp/i18n"
import { AppThemeProvider, createQueryClient } from "@ihsp/ui"
import { PinGate } from "@/features/pwa/components/pin-gate"
import { PwaGate } from "@/features/pwa/components/pwa-gate"
import { PushPromptGate } from "@/features/pwa/components/push-prompt-gate"
import { PwaRuntime } from "@/features/pwa/components/pwa-runtime"
import { QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { useEffect, useState, type ComponentType, type ReactNode } from "react"

type Bridge = ComponentType<{ children: ReactNode }>

/** True when Telegram launched the page: the same signs as `TELEGRAM_SDK_LOADER` in `layout.tsx`, without the SDK. */
function launchedByTelegram(): boolean {
  if (typeof window === "undefined") return false
  try {
    if (/tgWebApp/.test(window.location.hash) || "TelegramWebviewProxy" in window) return true
    return !!(sessionStorage.getItem("tapps/launchParams") || sessionStorage.getItem("__telegram__initParams"))
  } catch {
    return false
  }
}

/**
 * The mini-app bridge (theme, safe areas, SDK init) is imported only inside Telegram, so a browser visit never
 * downloads that chunk; until it arrives, and everywhere else, the children render unchanged.
 */
function TelegramBridge({ children }: { children: ReactNode }) {
  const [Loaded, setLoaded] = useState<Bridge | null>(null)
  useEffect(() => {
    if (!launchedByTelegram()) return
    let cancelled = false
    import("@ihsp/telegram")
      .then((telegram) => {
        if (!cancelled) setLoaded(() => telegram.TelegramBridge)
      })
      .catch((error: unknown) => console.error("[telegram] bridge failed to load", error))
    return () => {
      cancelled = true
    }
  }, [])
  return Loaded ? <Loaded>{children}</Loaded> : <>{children}</>
}

/**
 * The import paths are literal, so the bundler includes exactly the message files of this app:
 * `messages/<locale>.json` plus `messages/<locale>/tools.json` (study tools, written separately by W3) and
 * `messages/<locale>/notebooks.json` (notebooks, Studio and the Gemini-style assistant) and
 * `messages/<locale>/pwa.json` (the installable app: install page, update toast, menu entry).
 */
async function loadAppMessages(locale: Locale): Promise<Messages> {
  const [base, tools, notebooks, pwa] = await Promise.all([
    import(`../../messages/${locale}.json`),
    import(`../../messages/${locale}/tools.json`),
    import(`../../messages/${locale}/notebooks.json`),
    import(`../../messages/${locale}/pwa.json`),
  ])
  return mergeMessages(
    mergeMessages(mergeMessages(base.default as Messages, tools.default as Messages), notebooks.default as Messages),
    pwa.default as Messages,
  )
}

/**
 * ConfigGate (runtime config) → TanStack Query → i18n → nuqs → theme → Telegram bridge → install page (pwa mode only) →
 * auth → Telegram auto login. ConfigGate renders nothing while prerendering, so the static export never evaluates the
 * URL-reading providers. `PwaGate` and `PwaRuntime` do nothing unless `APP_MODE` is `pwa` (the app host).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <ConfigGate>
      <ErrorTrackingInit />
      <QueryClientProvider client={queryClient}>
        <I18nProvider app="sp" loadMessages={loadAppMessages}>
          <NuqsAdapter>
            <AppThemeProvider>
              <TelegramBridge>
                <PwaGate>
                  <AuthProvider>
                    <PwaRuntime />
                    <PushPromptGate />
                    <ThemePreferenceSync>
                      <TelegramAutoLogin>
                        <PinGate>{children}</PinGate>
                      </TelegramAutoLogin>
                    </ThemePreferenceSync>
                  </AuthProvider>
                </PwaGate>
              </TelegramBridge>
            </AppThemeProvider>
          </NuqsAdapter>
        </I18nProvider>
      </QueryClientProvider>
    </ConfigGate>
  )
}
