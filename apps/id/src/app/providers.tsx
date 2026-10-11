"use client"

import { AuthProvider } from "@ihsp/auth"
import { ConfigGate } from "@ihsp/config"
import { ThemePreferenceSync } from "@ihsp/features-core"
import { I18nProvider, type Locale, type Messages } from "@ihsp/i18n"
import { AppThemeProvider, createQueryClient } from "@ihsp/ui"
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

/** The path of the import is literal, so the bundler includes exactly the three message files of this app. */
async function loadAppMessages(locale: Locale): Promise<Messages> {
  const messages = await import(`../../messages/${locale}.json`)
  return messages.default as Messages
}

/**
 * ConfigGate (runtime config) → TanStack Query → i18n → nuqs → theme → auth → Telegram bridge.
 * ConfigGate renders nothing while prerendering, so the static export never evaluates the URL-reading providers.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <ConfigGate>
      <QueryClientProvider client={queryClient}>
        <I18nProvider app="id" loadMessages={loadAppMessages}>
          <NuqsAdapter>
            <AppThemeProvider>
              <TelegramBridge>
                <AuthProvider>
                  <ThemePreferenceSync>{children}</ThemePreferenceSync>
                </AuthProvider>
              </TelegramBridge>
            </AppThemeProvider>
          </NuqsAdapter>
        </I18nProvider>
      </QueryClientProvider>
    </ConfigGate>
  )
}
