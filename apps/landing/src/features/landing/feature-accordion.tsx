"use client"

import { useT } from "@ihsp/i18n"
import { cn, IconChevronLeft, IconChevronRight } from "@ihsp/ui"
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { DeviceFrame } from "../../components/device-mockup/device-frame"
import { SectionHead } from "./parts/section-head"
import { Reveal, useReducedMotion } from "./reveal"
import { AssistantPhone } from "./screens/ai"
import { BotPhone } from "./screens/bot"
import { DashboardPhone } from "./screens/dashboard"
import { LibraryPhone } from "./screens/learn"
import { MarksPhone } from "./screens/study"

const ITEMS: { key: string; screen: ReactNode }[] = [
  { key: "dashboard", screen: <DashboardPhone /> },
  { key: "study", screen: <MarksPhone /> },
  { key: "ai", screen: <AssistantPhone /> },
  { key: "learn", screen: <LibraryPhone /> },
  { key: "bot", screen: <BotPhone /> },
]

/** How long one item stays open and how often the progress bar updates. */
export const ACCORDION_MS = 6000
export const ACCORDION_TICK_MS = 100

/** The progress bar of the open item; reports once it is full. It only exists (and only ticks) while the show runs. */
function Progress({ running, onDone }: { running: boolean; onDone: () => void }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!running) return undefined
    const timer = setInterval(
      () => setValue((current) => current + ACCORDION_TICK_MS / ACCORDION_MS),
      ACCORDION_TICK_MS,
    )
    return () => clearInterval(timer)
  }, [running])
  useEffect(() => {
    if (value >= 1) onDone()
  }, [value, onDone])
  return (
    <span className="lnd-progress" data-lnd-progress aria-hidden>
      <span className="lnd-progress-bar" style={{ transform: `scaleX(${Math.min(value, 1)})` }} />
    </span>
  )
}

/** Five features on a phone: the open item drives the screen; it advances by itself unless the visitor is busy or prefers less motion. */
export function FeatureAccordion() {
  const t = useT("landing.features")
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const root = useRef<HTMLDivElement>(null)
  const count = ITEMS.length
  const advance = useCallback(() => setActive((index) => (index + 1) % count), [count])
  const go = (index: number, focus = false) => {
    const next = (index + count) % count
    setActive(next)
    if (focus) buttons.current[next]?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? index + 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? count - 1
              : null
    if (target === null) return
    event.preventDefault()
    go(target, true)
  }
  const current = ITEMS[active] ?? ITEMS[0]!
  return (
    <section id="features" aria-labelledby="features-title" className="lnd-section">
      <SectionHead id="features-title" eyebrow={t("eyebrow")} title={t("title")} />
      <Reveal delay={120}>
        <div
          ref={root}
          className="lnd-panel lnd-accordion"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(event) => {
            if (!root.current?.contains(event.relatedTarget as Node | null)) setPaused(false)
          }}
        >
          <ol aria-label={t("listLabel")} className="lnd-accordion-list">
            {ITEMS.map(({ key }, index) => {
              const open = index === active
              return (
                <li key={key} className={cn("lnd-accordion-item", open && "lnd-accordion-open")}>
                  <h3>
                    <button
                      ref={(node) => {
                        buttons.current[index] = node
                      }}
                      id={`feature-tab-${key}`}
                      type="button"
                      aria-expanded={open}
                      aria-controls={`feature-panel-${key}`}
                      className="lnd-accordion-button"
                      onClick={() => go(index)}
                      onKeyDown={(event) => onKeyDown(event, index)}
                    >
                      <span className="lnd-accordion-title">{t(`items.${key}.title`)}</span>
                    </button>
                  </h3>
                  <div
                    id={`feature-panel-${key}`}
                    role="region"
                    aria-labelledby={`feature-tab-${key}`}
                    className="lnd-collapse"
                    data-open={open}
                  >
                    <div className="lnd-collapse-inner">
                      <p className="lnd-accordion-text">{t(`items.${key}.text`)}</p>
                    </div>
                  </div>
                  {open && !reduced ? <Progress key={key} running={!paused} onDone={advance} /> : null}
                </li>
              )
            })}
          </ol>
          <div className="lnd-accordion-stage">
            <div className="lnd-phone">
              <DeviceFrame device="phone" label={t(`items.${current.key}.screen`)}>
                <div key={current.key} className="lnd-screen-swap h-full w-full">
                  {current.screen}
                </div>
              </DeviceFrame>
            </div>
            <div className="lnd-stage-nav">
              <button type="button" className="lnd-round" aria-label={t("previous")} onClick={() => go(active - 1)}>
                <IconChevronLeft aria-hidden />
              </button>
              <button type="button" className="lnd-round" aria-label={t("next")} onClick={() => go(active + 1)}>
                <IconChevronRight aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
