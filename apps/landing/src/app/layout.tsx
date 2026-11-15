import "@ihsp/ui/styles"
import "./landing.css"
import { BRAND } from "@ihsp/config/brand"
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { ORGANIZATION_JSON_LD } from "./json-ld"
import { LANG_INIT_SCRIPT } from "./lang-init"
import { Providers } from "./providers"

const TITLE = `${BRAND.apps.sp.name} — ${BRAND.orgAlias}`
const DESCRIPTION = `Making everyday studying at ${BRAND.orgAlias} more convenient: marks, timetable, homework, AI study notebooks.`

// The language is chosen on the client, so there is one URL and no hreflang alternates.
export const metadata: Metadata = {
  metadataBase: new URL(`https://${BRAND.landingHost}`),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: BRAND.orgName,
    title: TITLE,
    description: DESCRIPTION,
    images: [BRAND.logos.png64],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND.colors.landingBarLight },
    { media: "(prefers-color-scheme: dark)", color: BRAND.colors.landingBarDark },
  ],
}

/**
 * Light or dark before first paint: the stored choice of the other apps (`theme`), else the system setting
 * (a landing page follows the visitor's device, unlike the apps whose default is light).
 */
const LANDING_THEME_SCRIPT = `try{var d=document.documentElement;var m=localStorage.getItem('theme');var k=m==='dark'||((!m||m==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);d.classList.add(k?'dark':'light');d.style.colorScheme=k?'dark':'light'}catch(e){}`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" data-theme="vercel" suppressHydrationWarning>
      <head>
        <script src="/env.js" />
        <script dangerouslySetInnerHTML={{ __html: LANDING_THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_INIT_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }} />
      </head>
      <body className="landing bg-background text-foreground min-h-dvh overflow-x-hidden font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
