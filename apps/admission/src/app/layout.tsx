import "@ihsp/ui/styles"
import { BRAND } from "@ihsp/config/brand"
import { createPwaHeadScript } from "@ihsp/features-core/pwa/head"
import { THEME_INIT_SCRIPT } from "@ihsp/ui/theme-init"
import { LANG_INIT_SCRIPT } from "./lang-init"
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Providers } from "./providers"

const DESCRIPTION = "Preparing applications to universities"

export const metadata: Metadata = {
  title: BRAND.apps.admission.name,
  description: DESCRIPTION,
  metadataBase: new URL(`https://${BRAND.admissionHost}`),
  openGraph: {
    type: "website",
    siteName: BRAND.apps.admission.name,
    title: BRAND.apps.admission.name,
    description: DESCRIPTION,
    images: [BRAND.logos.png64],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/logo.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
}

/** The head script of the installable app (`APP_MODE=pwa`): manifest link, iOS tags, install prompt catcher. */
const PWA_HEAD_SCRIPT = createPwaHeadScript(BRAND.apps.admission.pwaName)

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

/** Static root layout. `/env.js` is a blocking script, so `window.__ENV__` exists before any app code runs. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" data-theme="vercel" suppressHydrationWarning>
      <head>
        <script src="/env.js" />
        <script dangerouslySetInnerHTML={{ __html: PWA_HEAD_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_INIT_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground min-h-dvh overflow-x-hidden font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
