import type { Metadata } from "next"
import type { ReactNode } from "react"

/** Signed-in pages are not for search engines (the host's robots.txt closes them too). */
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
