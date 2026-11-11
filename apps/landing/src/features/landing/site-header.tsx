"use client"

import { BRAND } from "@ihsp/config/brand"
import { useT } from "@ihsp/i18n"
import { IconMenu2, IconX, cn } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { useLandingLinks } from "./links"
import { LocaleSwitch } from "./locale-switch"

const ANCHORS = ["features", "ecosystem", "mcp", "journal", "bot"] as const

const SUPPORT_URL = "https://t.me/ihtsupport"

/** Full width on top of the page; shrinks into a floating pill once the page is scrolled. */
export function SiteHeader() {
  const t = useT("landing")
  const links = useLandingLinks()
  const [compact, setCompact] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const update = () => setCompact(window.scrollY > 32)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-3">
        <div
          className={cn(
            "pointer-events-auto w-full border transition-[max-width,background-color,box-shadow,border-color,border-radius] duration-500 ease-out motion-reduce:transition-none",
            compact
              ? "bg-background/80 max-w-3xl rounded-[28px] shadow-lg backdrop-blur-xl"
              : "max-w-6xl rounded-[28px] border-transparent bg-transparent",
          )}
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <a href="#top" className="flex min-h-11 items-center gap-2 rounded-full pr-2 font-semibold">
              {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file of /public */}
              <img src={BRAND.logos.svg} alt={t("logoAlt")} width={32} height={32} className="size-8 rounded-lg" />
              <span className="hidden sm:inline">{t("brand")}</span>
            </a>
            <nav aria-label={t("nav.label")} className="ml-auto hidden items-center gap-1 md:flex">
              {ANCHORS.map((key) => (
                <a
                  key={key}
                  href={`#${key}`}
                  className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium transition-colors"
                >
                  {t(`nav.${key}`)}
                </a>
              ))}
            </nav>
            <div className="ml-auto md:ml-0">
              <LocaleSwitch />
            </div>
            <a
              href={`${links.sp}/`}
              className="hidden min-h-11 items-center rounded-full bg-[var(--brand)] px-5 sm:inline-flex text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
            >
              {t("nav.signIn")}
            </a>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? t("nav.close") : t("nav.menu")}
              onClick={() => setOpen((value) => !value)}
              className="hover:bg-muted inline-flex size-11 items-center justify-center rounded-full md:hidden"
            >
              {open ? <IconX aria-hidden className="size-5" /> : <IconMenu2 aria-hidden className="size-5" />}
            </button>
          </div>
          {open ? (
            <nav id="mobile-nav" aria-label={t("nav.label")} className="grid gap-1 border-t px-3 py-3 md:hidden">
              {ANCHORS.map((key) => (
                <a
                  key={key}
                  href={`#${key}`}
                  onClick={() => setOpen(false)}
                  className="hover:bg-muted inline-flex min-h-11 items-center rounded-xl px-3 font-medium"
                >
                  {t(`nav.${key}`)}
                </a>
              ))}
              <a
                href={`${links.sp}/`}
                className="mt-1 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-5 font-semibold text-[var(--brand-ink)] sm:hidden"
              >
                {t("nav.signIn")}
              </a>
            </nav>
          ) : null}
        </div>
      </header>
      <aside aria-label={t("banner.label")} className="mt-[76px] flex justify-center px-3">
        <p className="bg-[var(--brand-soft)] max-w-3xl rounded-2xl px-4 py-2 text-center text-sm text-balance">
          {t("banner.intro")}{" "}
          <a
            href={links.bot}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--brand-text)] underline underline-offset-4"
          >
            {t("banner.bot")}
          </a>{" "}
          {t("banner.joiner")}
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--brand-text)] underline underline-offset-4"
          >
            {t("banner.support")}
          </a>
          {t("banner.end")}
        </p>
      </aside>
    </>
  )
}
