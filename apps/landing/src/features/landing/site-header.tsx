"use client"

import { BRAND } from "@ihsp/config/brand"
import { useT } from "@ihsp/i18n"
import { IconBrandTelegram, IconMenu2, IconX, cn } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { ctaPrimary, ctaSecondary } from "./cta-styles"
import { useLandingLinks } from "./links"
import { LocaleSwitch } from "./locale-switch"
import { focusables, useModal } from "./use-modal"

const ANCHORS = ["features", "apps", "integrations", "control", "faq"] as const

/** Transparent over the hero; a floating glass pill once the page is scrolled. Below 1024px a glass menu panel. */
export function SiteHeader({ base = "" }: { base?: string }) {
  const t = useT("landing")
  const links = useLandingLinks()
  const [compact, setCompact] = useState(false)
  const [open, setOpen] = useState(false)
  const toggler = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => setCompact(window.scrollY > 24)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  // Past the breakpoint the desktop navigation takes over.
  useEffect(() => {
    if (!open) return
    const query = window.matchMedia("(min-width: 1024px)")
    const close = () => {
      if (query.matches) setOpen(false)
    }
    query.addEventListener("change", close)
    return () => query.removeEventListener("change", close)
  }, [open])

  const close = (restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) toggler.current?.focus()
  }
  useModal({
    open,
    onClose: () => close(true),
    getFocusable: () => [...(toggler.current ? [toggler.current] : []), ...focusables(panel.current)],
  })
  useEffect(() => {
    if (open) focusables(panel.current)[0]?.focus()
  }, [open])

  return (
    <header className="hdr" data-compact={compact}>
      <div className={cn("hdr-bar", compact ? "lnd-glass" : "lnd-on-dawn")}>
        <a href={`${base}#top`} className="hdr-brand">
          {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file of /public */}
          <img src={BRAND.logos.svg} alt={t("logoAlt")} width={32} height={32} className="size-8 rounded-lg" />
          <span className="hdr-brand-text">{t("brand")}</span>
        </a>
        <nav aria-label={t("nav.label")} className="hdr-nav">
          {ANCHORS.map((key) => (
            <a key={key} href={`${base}#${key}`} className="hdr-link">
              {t(`nav.${key}`)}
            </a>
          ))}
          <a href="/clubs/" className="hdr-link">
            {t("nav.clubs")}
          </a>
        </nav>
        <div className="hdr-end">
          <LocaleSwitch />
          <a href={`${links.sp}/`} className={cn(ctaPrimary, "lnd-btn--sm")}>
            {t("nav.open")}
          </a>
        </div>
        <button
          ref={toggler}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? t("nav.close") : t("nav.menu")}
          onClick={() => (open ? close(false) : setOpen(true))}
          className="hdr-burger"
        >
          {open ? <IconX aria-hidden className="size-6" /> : <IconMenu2 aria-hidden className="size-6" />}
        </button>
      </div>
      {open ? (
        <div
          ref={panel}
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.menu")}
          className="hdr-panel lnd-glass"
        >
          <nav aria-label={t("nav.label")} className="grid">
            {ANCHORS.map((key) => (
              <a key={key} href={`${base}#${key}`} onClick={() => close(false)} className="hdr-link">
                {t(`nav.${key}`)}
              </a>
            ))}
            <a href="/clubs/" onClick={() => close(false)} className="hdr-link">
              {t("nav.clubs")}
            </a>
          </nav>
          <div className="hdr-panel-row">
            <LocaleSwitch />
          </div>
          <div className="hdr-panel-row">
            <a href={`${links.sp}/`} className={ctaPrimary}>
              {t("nav.open")}
            </a>
            <a href={links.bot} target="_blank" rel="noopener noreferrer" className={ctaSecondary}>
              <IconBrandTelegram aria-hidden className="size-5" />
              {t("hero.bot")}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  )
}
