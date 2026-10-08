import "@ihsp/ui/styles"
import { THEME_INIT_SCRIPT } from "@ihsp/ui/theme-init"
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "IHSP Student Portal",
  description: "Timetable, grades, homework and study tools",
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
    <html lang="ru" data-theme="vercel" suppressHydrationWarning>
      <head>
        <script src="/env.js" />
        <script src="https://telegram.org/js/telegram-web-app.js?64" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground min-h-dvh overflow-x-hidden font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
