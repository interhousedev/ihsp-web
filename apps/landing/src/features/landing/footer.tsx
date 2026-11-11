"use client"

import { useT } from "@ihsp/i18n"
import { IconBrandTelegram } from "@ihsp/ui"
import { ctaPrimary, ctaSecondary } from "./hero"
import { useLandingLinks } from "./links"
import { Reveal } from "./reveal"
import { parseSecurityContact } from "./security-contact"

function SecurityContact({ contact }: { contact: string }) {
  const t = useT("landing.footer")
  return (
    <p className="text-sm">
      <span className="text-muted-foreground">{t("security")}: </span>
      {parseSecurityContact(contact).map((part, index) =>
        part.kind === "text" ? (
          <span key={index}>{part.text}</span>
        ) : (
          <a
            key={index}
            href={part.href}
            className="inline-flex min-h-11 items-center text-[var(--brand-text)] underline underline-offset-4"
          >
            {part.text}
          </a>
        ),
      )}
    </p>
  )
}

/** The closing call to sign in. */
export function FinalCta() {
  const t = useT("landing.cta")
  const links = useLandingLinks()
  return (
    <section aria-labelledby="cta-title" className="px-4 py-16 sm:py-24">
      <Reveal className="mx-auto max-w-4xl rounded-[32px] bg-[var(--brand-soft)] px-5 py-12 text-center sm:px-12">
        <h2 id="cta-title" className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
          {t("title")}
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">{t("text")}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href={`${links.sp}/`} className={ctaPrimary}>
            {t("button")}
          </a>
          <a href={links.bot} target="_blank" rel="noopener noreferrer" className={ctaSecondary}>
            <IconBrandTelegram aria-hidden className="size-5" />
            {t("bot")}
          </a>
        </div>
      </Reveal>
    </section>
  )
}

export function SiteFooter() {
  const t = useT("landing")
  const links = useLandingLinks()
  const apps: [string, string][] = [
    [t("footer.sp"), links.sp],
    [t("footer.staff"), links.staff],
    [t("footer.lms"), links.lms],
    [t("footer.library"), links.library],
  ]
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2">
        <nav aria-label={t("footer.apps")}>
          <h2 className="mb-2 font-semibold">{t("footer.apps")}</h2>
          <ul className="flex flex-wrap gap-x-5">
            {apps.map(([name, href]) => (
              <li key={name}>
                <a href={`${href}/`} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                  {name}
                </a>
              </li>
            ))}
            <li>
              <a href={links.bot} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                {t("footer.bot")}
              </a>
            </li>
          </ul>
        </nav>
        <div className="grid gap-3 sm:justify-items-end empty:hidden">
          {links.securityContact ? <SecurityContact contact={links.securityContact} /> : null}
        </div>
        <p className="text-muted-foreground text-sm sm:col-span-2">© {t("footer.rights")}</p>
      </div>
    </footer>
  )
}
