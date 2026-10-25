import "@ihsp/ui/styles"
import "./landing.css"
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { LANG_INIT_SCRIPT } from "./lang-init"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "my.iht — Interhouse",
  description:
    "Making everyday studying at Interhouse more convenient: marks, timetable, homework, AI study notebooks.",
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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1430" },
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
      </head>
      <body className="landing bg-background text-foreground min-h-dvh overflow-x-hidden font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
