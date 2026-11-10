"use client"

import { BRAND } from "@ihsp/config/brand"
import { useT } from "@ihsp/i18n"
import { IconArrowDown, IconBrandTelegram } from "@ihsp/ui"
import { useEffect, useRef } from "react"
import { DeviceFrame } from "../../components/device-mockup/device-frame"
import { useLandingLinks } from "./links"
import { useReducedMotion } from "./reveal"
import { DashboardLaptop, DashboardPhone } from "./screens/dashboard"

export const ctaPrimary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-7 text-base font-semibold text-[var(--brand-ink)] shadow-lg transition-colors hover:bg-[var(--brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
export const ctaSecondary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-7 text-base font-semibold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"

/** The first screen: headline, the sign-in call and a laptop and a phone that drift apart while the page scrolls. */
export function Hero() {
  const t = useT("landing")
  const links = useLandingLinks()
  const reduced = useReducedMotion()
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = stage.current
    if (!node || reduced) return
    let frame = 0
    const update = () => {
      frame = 0
      const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight)))
      node.style.setProperty("--p", progress.toFixed(3))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [reduced])

  return (
    <section id="top" className="relative overflow-hidden px-4 pt-28 pb-10 sm:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(ellipse_at_50%_0%,var(--brand-soft),transparent_70%)]"
      />
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          <span className="text-[var(--brand-text)]">{BRAND.apps.sp.name}</span>
          <span className="block">{t("hero.title")}</span>
        </h1>
        <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-lg text-balance">{t("hero.lead")}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href={`${links.sp}/`} className={ctaPrimary}>
            {t("hero.cta")}
          </a>
          <a href={links.bot} target="_blank" rel="noopener noreferrer" className={ctaSecondary}>
            <IconBrandTelegram aria-hidden className="size-5" />
            {t("hero.bot")}
          </a>
        </div>
      </div>
      <div
        ref={stage}
        style={{ "--p": 0 } as React.CSSProperties}
        className="relative mx-auto mt-12 max-w-5xl pb-10 sm:mt-16"
      >
        <div
          className="mx-auto w-full max-w-[860px] will-change-transform"
          style={{ transform: "translateY(calc(var(--p) * 40px)) scale(calc(1 - var(--p) * 0.04))" }}
        >
          <DeviceFrame device="laptop" label={t("hero.laptopAlt")}>
            <DashboardLaptop />
          </DeviceFrame>
        </div>
        <div
          className="absolute right-[-2%] bottom-0 w-[24%] min-w-[96px] will-change-transform sm:right-[2%]"
          style={{ transform: "translateY(calc(var(--p) * -90px)) rotate(calc(var(--p) * 4deg))" }}
        >
          <DeviceFrame device="phone" label={t("hero.phoneAlt")}>
            <DashboardPhone />
          </DeviceFrame>
        </div>
      </div>
      <a
        href="#features"
        aria-label={t("hero.scroll")}
        className="text-muted-foreground hover:text-foreground mx-auto flex size-11 items-center justify-center rounded-full border motion-safe:animate-bounce"
      >
        <IconArrowDown aria-hidden className="size-5" />
      </a>
    </section>
  )
}
