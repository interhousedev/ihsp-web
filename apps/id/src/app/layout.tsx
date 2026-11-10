import "@ihsp/ui/styles"
import { BRAND } from "@ihsp/config/brand"
import { TELEGRAM_SDK_LOADER } from "@ihsp/telegram/sdk-loader"
import { THEME_INIT_SCRIPT } from "@ihsp/ui/theme-init"
import { LANG_INIT_SCRIPT } from "./lang-init"
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: BRAND.apps.id.name,
  description: "Log in, registration and account security",
  icons: {
    icon: [
      { url: "/icons/logo.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

/**
 * Static root layout (no cookies, no headers). `/env.js` is a plain blocking script, so `window.__ENV__` exists
 * before any app code runs; the locale is applied on the client by `I18nProvider`.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" data-theme="vercel" suppressHydrationWarning>
      <head>
        <script src="/env.js" />
        <script dangerouslySetInnerHTML={{ __html: TELEGRAM_SDK_LOADER }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_INIT_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground min-h-dvh overflow-x-hidden font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
