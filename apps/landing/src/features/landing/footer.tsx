"use client"

import { BRAND } from "@ihsp/config/brand"
import { useT } from "@ihsp/i18n"
import { IconBrandTelegram } from "@ihsp/ui"
import { ctaPrimary, ctaSecondary } from "./cta-styles"
import { LocaleSwitch } from "./locale-switch"
import { SOURCE_URLS, SUPPORT_HANDLE, SUPPORT_URL, useLandingLinks } from "./links"
import { Reveal } from "./reveal"
import { parseSecurityContact } from "./security-contact"

function SecurityContact({ contact }: { contact: string }) {
  const t = useT("landing.footer")
  return (
    <li className="text-sm">
      <span className="text-muted-foreground">{t("security")}: </span>
      {parseSecurityContact(contact).map((part, index) =>
        part.kind === "text" ? (
          <span key={index}>{part.text}</span>
        ) : (
          <a key={index} href={part.href} className="ftr-link">
            {part.text}
          </a>
        ),
      )}
    </li>
  )
}

/** The closing call to sign in. */
export function FinalCta() {
  const t = useT("landing.cta")
  const links = useLandingLinks()
  return (
    <section id="join" aria-labelledby="cta-title" className="lnd-section">
      <Reveal className="cta-card lnd-dawn lnd-on-dawn">
        <h2 id="cta-title" className="lnd-h2">
          {t("title")}
        </h2>
        <p className="cta-text">{t("text")}</p>
        <div className="cta-actions">
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

export function SiteFooter({ onOpenManifesto }: { onOpenManifesto: () => void }) {
  const t = useT("landing")
  const links = useLandingLinks()
  // The bot is the one entry that leaves the site, so it opens in a new tab like the other external links.
  const apps: [string, string, boolean][] = [
    [t("footer.sp"), `${links.sp}/`, false],
    [t("footer.staff"), `${links.staff}/`, false],
    [t("footer.lms"), `${links.lms}/`, false],
    [t("footer.library"), `${links.library}/`, false],
    [t("footer.bot"), links.bot, true],
  ]
  return (
    <footer className="lnd-section">
      <div className="lnd-panel ftr-panel">
        <div className="ftr-brand">
          <img src={BRAND.logos.svg} alt={t("logoAlt")} width={40} height={40} />
          <p>{t("brand")}</p>
          <p>{t("footer.tagline")}</p>
        </div>
        <nav aria-label={t("footer.apps")} className="ftr-col">
          <h2>{t("footer.apps")}</h2>
          <ul>
            {apps.map(([name, href, external]) => (
              <li key={name}>
                <a
                  href={href}
                  className="ftr-link"
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t("footer.resources")} className="ftr-col">
          <h2>{t("footer.resources")}</h2>
          <ul>
            <li>
              <a href="#features" className="ftr-link">
                {t("footer.features")}
              </a>
            </li>
            <li>
              <a href="#integrations" className="ftr-link">
                {t("footer.integrations")}
              </a>
            </li>
            <li>
              <a href="#faq" className="ftr-link">
                {t("footer.faq")}
              </a>
            </li>
            <li>
              <button type="button" onClick={onOpenManifesto} className="ftr-link">
                {t("footer.principles")}
              </button>
            </li>
          </ul>
        </nav>
        <div className="ftr-col">
          <h2>{t("footer.support")}</h2>
          <ul>
            <li>
              <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="ftr-link">
                @{SUPPORT_HANDLE}
              </a>
            </li>
            {links.securityContact ? <SecurityContact contact={links.securityContact} /> : null}
          </ul>
        </div>
        <div className="ftr-col">
          <h2>{t("footer.source")}</h2>
          <ul>
            <li>
              <a href={SOURCE_URLS.web} target="_blank" rel="noopener noreferrer" className="ftr-link">
                {t("footer.web")}
              </a>
            </li>
            <li>
              <a href={SOURCE_URLS.backend} target="_blank" rel="noopener noreferrer" className="ftr-link">
                {t("footer.backend")}
              </a>
            </li>
            <li className="text-sm">{t("footer.license")}</li>
          </ul>
        </div>
        <div className="ftr-bottom">
          <LocaleSwitch showNames />
          <p>© {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  )
}
