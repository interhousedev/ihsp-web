import "@ihsp/ui/styles"
import { THEME_INIT_SCRIPT } from "@ihsp/ui/theme-init"
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "IHSP shares",
  description: "Shared assistant chats and flash card sets",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

/**
 * Static root layout. The app is served under `/ai`, so the blocking runtime-config script is `/ai/env.js`.
 * Shared pages are public but not for search engines (`noindex`); the locale is applied on the client.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" data-theme="vercel" suppressHydrationWarning>
      <head>
        <script src="/ai/env.js" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground min-h-dvh overflow-x-hidden font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
