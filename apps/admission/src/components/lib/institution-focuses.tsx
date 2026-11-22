"use client"

import { useT } from "@ihsp/i18n"

export type Focus = { text: string; quote: string; source_url: string }

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "")
  } catch {
    return url
  }
}

/** What a university says it looks for: verified focuses with the quote and the page. Renders nothing when empty. */
export function InstitutionFocuses({ name, focuses }: { name: string; focuses?: readonly Focus[] | null }) {
  const t = useT("focuses")
  if (!focuses || focuses.length === 0) return null
  return (
    <section aria-label={t("title", { name })} className="flex flex-col gap-2" data-testid="institution-focuses">
      <h3 className="text-base font-semibold">{t("title", { name })}</h3>
      <ul className="flex flex-col gap-3">
        {focuses.map((focus) => (
          <li key={`${focus.source_url}-${focus.quote}`} className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{focus.text}</span>
            <blockquote className="border-hairline-strong text-muted-foreground border-s-2 ps-3 text-xs italic">
              {focus.quote}
            </blockquote>
            <a
              href={focus.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-xs underline-offset-2 hover:underline"
            >
              {t("source", { host: hostOf(focus.source_url) })}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
