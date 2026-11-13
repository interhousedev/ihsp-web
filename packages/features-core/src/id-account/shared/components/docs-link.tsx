"use client"

/** A link to a documentation page in a new tab; renders nothing while the URL is unknown (config loading, failed or unset). */
export function DocsLink({ href, children }: { href: string | null | undefined; children: string }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">
      {children}
    </a>
  )
}
