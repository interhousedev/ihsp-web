import "@ihsp/ui/styles"
import "./stepik.css"
import { createPwaHeadScript } from "@ihsp/features-core/pwa/head"
import { THEME_INIT_SCRIPT } from "@ihsp/ui/theme-init"
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "lms.iht",
  description: "Courses, tests and course editor",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
}

/** The head script of the installable app (`APP_MODE=pwa`): manifest link, iOS tags, install prompt catcher. */
const PWA_HEAD_SCRIPT = createPwaHeadScript("IHT Courses")

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

/**
 * Static root layout (no cookies, no headers). `/env.js` is a plain blocking script, so `window.__ENV__` exists
 * before any app code runs. `THEME_INIT_SCRIPT` sets `<html lang>` from the stored locale before first paint (`uz` by default, the
 * primary locale; `I18nProvider` keeps it in step afterwards). The PWA head script only acts when
 * `APP_MODE` is `pwa`.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" data-theme="vercel" suppressHydrationWarning>
      <head>
        <script src="/env.js" />
        <script dangerouslySetInnerHTML={{ __html: PWA_HEAD_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground min-h-dvh overflow-x-hidden font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
