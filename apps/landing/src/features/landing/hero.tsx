"use client"

import { BRAND } from "@ihsp/config/brand"
import { useT } from "@ihsp/i18n"
import { IconArrowDown, IconBrandTelegram } from "@ihsp/ui"
import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatedBackdrop } from "../../components/backgrounds"
import { useFinish, type DeviceKind } from "../../components/device-mockup/device-frame"
import { DeviceStage } from "../../components/device-mockup/device-stage"
import type { FoldPose } from "../../components/device-mockup/devices"
import { detectDevice, readDeviceSignals } from "./detect-device"
import { DeviceSwitcher } from "./device-switcher"
import { useLandingLinks } from "./links"
import { useReducedMotion } from "./reveal"
import { DashboardLaptop, DashboardPhone, DashboardTablet } from "./screens/dashboard"

export const ctaPrimary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-7 text-base font-semibold text-[var(--brand-ink)] shadow-lg transition-colors hover:bg-[var(--brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
export const ctaSecondary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-7 text-base font-semibold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"

/** The first screen: headline, the sign-in call and one device that morphs between laptop, phone, tablet and foldable. */
export function Hero() {
  const t = useT("landing")
  const links = useLandingLinks()
  const reduced = useReducedMotion()
  const stage = useRef<HTMLDivElement>(null)
  // The static page always starts on the laptop; the visitor's own device is picked after mount.
  const [device, setDevice] = useState<DeviceKind>("laptop")
  // Choosing the foldable shows it closed, then unfolds it (the 3D fold); other devices have no pose.
  const [pose, setPose] = useState<FoldPose>("open")
  const finish = useFinish()
  useEffect(() => {
    setDevice(detectDevice(readDeviceSignals()))
  }, [])
  const choose = (next: DeviceKind) => {
    setDevice(next)
    setPose(next === "foldable" && !reduced ? "closed" : "open")
  }
  useEffect(() => {
    if (device !== "foldable" || pose !== "closed") return
    const timer = setTimeout(() => setPose("open"), 900)
    return () => clearTimeout(timer)
  }, [device, pose])
  const screens = useMemo(
    () => ({
      laptop: <DashboardLaptop />,
      phone: <DashboardPhone />,
      tablet: <DashboardTablet />,
      foldable: pose === "open" ? <DashboardTablet /> : <DashboardPhone />,
    }),
    [pose],
  )
  const foldScreens = useMemo(() => ({ open: <DashboardTablet />, closed: <DashboardPhone /> }), [])

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
    <section id="top" className="relative isolate overflow-hidden px-4 pt-28 pb-10 sm:pt-36">
      <AnimatedBackdrop grid beam />
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
      <div className="mt-8 flex max-w-full justify-center sm:mt-10">
        <DeviceSwitcher value={device} onChange={choose} />
      </div>
      <div
        ref={stage}
        style={{ "--p": 0 } as React.CSSProperties}
        className="relative mx-auto mt-4 w-full max-w-5xl pb-6 sm:mt-6 sm:pb-10"
      >
        <div
          className="will-change-transform"
          style={{ transform: "translateY(calc(var(--p) * 40px)) scale(calc(1 - var(--p) * 0.04))" }}
        >
          <DeviceStage
            device={device}
            pose={pose}
            finish={finish}
            screens={screens}
            foldScreens={foldScreens}
            reduced={reduced}
            label={t(`hero.${device}Alt`)}
          />
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
