"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { isApiError } from "@ihsp/api"
import { useDuoCourse, useMyBadgeStrip, useMyLevel, lessonHref } from "./use-duo-course"
import { localized } from "../badges/utils/labels"
import { BadgeMedal } from "../badges/components/badge-medal"
import type { PathNode, StepKind } from "./use-duo-course"
import "../skin/playful-lesson.css"
import "./duo-coach.css"

export const KIND_ICON: Record<StepKind, (props: React.SVGProps<SVGSVGElement>) => React.ReactNode> = {
  text: Icons.page,
  video: Icons.video,
  interactive_video: Icons.play,
  test: Icons.checks,
  flashcards: Icons.flashcards,
  h5p: Icons.forms,
  html: Icons.adjustments,
  code: Icons.code,
  exam: Icons.clock,
  ai_review: Icons.sparkles,
}

type Geometry = { d: string; fillY: number; width: number; height: number }

/** Reads the centres of the banners and nodes and builds one smooth line through all of them. */
function measure(root: HTMLElement): Geometry {
  const box = root.getBoundingClientRect()
  const points = Array.from(root.querySelectorAll<HTMLElement>("[data-pt]")).map((el) => {
    const r = el.getBoundingClientRect()
    return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2, state: el.dataset.state ?? "" }
  })
  let d = ""
  let fillY = 0
  points.forEach((pt, i) => {
    if (i === 0) d = `M${pt.x},${pt.y}`
    else {
      const prev = points[i - 1]!
      const mid = (prev.y + pt.y) / 2
      d += ` C${prev.x},${mid} ${pt.x},${mid} ${pt.x},${pt.y}`
    }
    if (pt.state === "done" || pt.state === "current") fillY = pt.y
  })
  return { d, fillY, width: box.width, height: box.height }
}

/**
 * Mockup of the Duo course path: one winding line runs through every section banner and lesson. The part up to the
 * current lesson is filled; a locked lesson opens a sheet with the reason and a way forward, never a failing player.
 * `?course=general|exam|code|interactive|cards|project` switches the demo course.
 */
/**
 * The Duo course path of `/v1/lms/courses/{slug}`: one winding line runs through every section banner and lesson. The
 * part up to the current lesson is filled; a locked lesson opens a sheet with the reason (`lock_reason`), never a
 * failing player. `?slug=` names the course.
 */
export function MasteryPath() {
  const t = useT("duo")
  const slug = useSearchParams().get("slug")
  const { course: loaded, isPending, isError, error } = useDuoCourse(slug)
  const missing = isApiError(error) && error.status === 404
  const path = loaded?.path ?? null
  const level = useMyLevel(loaded?.id).data
  const course = loaded?.slug ?? ""
  const [open, setOpen] = useState<PathNode | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [geo, setGeo] = useState<Geometry | null>(null)
  const clipId = useId()

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const update = () => setGeo(measure(root))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(root)
    void document.fonts?.ready.then(update)
    return () => observer.disconnect()
  }, [course, path])

  let index = 0
  if (path === null) {
    return (
      <div data-skin="playful" className="min-h-dvh p-6" style={{ background: "var(--pl-bg)", color: "var(--pl-fg)" }}>
        <p role="status">
          {slug === null || missing
            ? t("path.notFound")
            : isError
              ? t("path.notEnrolled")
              : isPending
                ? t("path.loading")
                : t("path.notFound")}
        </p>
        {slug !== null && isError && !missing ? (
          <Link
            href={`/course/?slug=${encodeURIComponent(slug)}`}
            prefetch={false}
            className="dc-ghost mt-4 inline-block"
          >
            {t("path.enroll")}
          </Link>
        ) : null}
      </div>
    )
  }
  return (
    <div data-skin="playful" className="min-h-dvh" style={{ background: "var(--pl-bg)", color: "var(--pl-fg)" }}>
      <div className="pl-path dc-line-host" data-testid="course-path" ref={rootRef}>
        {geo ? (
          <svg className="dc-line" width={geo.width} height={geo.height} aria-hidden>
            <defs>
              <clipPath id={clipId}>
                <rect x="0" y="0" width={geo.width} height={geo.fillY} />
              </clipPath>
            </defs>
            <path d={geo.d} className="dc-line-base" />
            <path d={geo.d} className="dc-line-fill" clipPath={`url(#${clipId})`} />
          </svg>
        ) : null}
        <h1 className="mb-4 text-2xl font-extrabold">{path.title}</h1>
        {level ? (
          <p className="mb-3 text-sm font-semibold" style={{ color: "var(--pl-muted-fg)" }} data-testid="my-level">
            {t("path.level", { level: level.level, into: level.xp_into_level, next: level.xp_for_next })}
          </p>
        ) : null}
        {loaded?.enrolledVia === "club" || loaded?.enrolledVia === "group" ? (
          <p className="mb-3 text-sm font-semibold" style={{ color: "var(--pl-muted-fg)" }}>
            {t(`path.via.${loaded.enrolledVia}`)}
          </p>
        ) : null}
        {path.club ? (
          <Link href="/duo/club/" prefetch={false} className="dc-club-chip">
            <Icons.teams className="size-4" aria-hidden />
            {t("path.club", { name: path.club })}
            <Icons.arrowRight className="size-4" aria-hidden />
          </Link>
        ) : null}
        {path.sections.map((section, sectionIndex) => {
          const done = section.nodes.filter((node) => node.state === "done").length
          return (
            <section key={section.id} aria-labelledby={`s-${section.id}`} className="dc-section">
              <header
                className="pl-banner flex items-center justify-between gap-3"
                data-tone={sectionIndex % 4}
                data-pt="banner"
                data-state={done === section.nodes.length ? "done" : done > 0 ? "current" : "locked"}
              >
                <div className="min-w-0">
                  <p className="text-xs font-extrabold tracking-wide uppercase opacity-90">
                    {t("path.section", { number: sectionIndex + 1 })}
                  </p>
                  <h2 id={`s-${section.id}`} className="text-lg font-extrabold text-balance">
                    {section.title}
                  </h2>
                </div>
                <div
                  className="dc-ring"
                  style={{ "--p": Math.round((done / section.nodes.length) * 100) } as React.CSSProperties}
                  role="img"
                  aria-label={t("path.progress", { done, total: section.nodes.length })}
                >
                  <span>
                    {done}/{section.nodes.length}
                  </span>
                </div>
              </header>
              <ol className="pl-nodes">
                {section.nodes.map((node) => {
                  const position = index++
                  const KindIcon = KIND_ICON[node.kind]
                  const Icon = node.state === "locked" ? Icons.lock : node.state === "done" ? Icons.check : KindIcon
                  const label = `${node.title}. ${t(`kind.${node.kind}`)}. ${t(`path.state.${node.state}`)}`
                  return (
                    <li
                      key={node.id}
                      className="pl-node-wrap"
                      data-state={node.state}
                      data-side={position % 2 === 0 ? "left" : "right"}
                    >
                      {node.state === "locked" ? (
                        <button
                          type="button"
                          className="pl-node"
                          data-state="locked"
                          data-pt="node"
                          aria-label={label}
                          aria-haspopup="dialog"
                          onClick={() => setOpen(node)}
                        >
                          <Icon aria-hidden />
                        </button>
                      ) : (
                        <Link
                          href={lessonHref(course, node.id)}
                          prefetch={false}
                          className="pl-node"
                          data-state={node.state}
                          data-pt="node"
                          aria-label={label}
                        >
                          <Icon aria-hidden />
                        </Link>
                      )}
                      <span className="pl-node-label" aria-hidden>
                        {node.state === "current" ? <span className="pl-bubble">{t("path.continue")}</span> : null}
                        {node.title}
                        <span className="dc-kind">
                          {t(`kind.${node.kind}`)} · {t("path.minutes", { n: node.minutes })}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
        <BadgeStrip />
      </div>

      {open ? <LockSheet node={open} onClose={() => setOpen(null)} /> : null}
    </div>
  )
}

function LockSheet({ node, onClose }: { node: PathNode; onClose: () => void }) {
  const t = useT("duo")
  const lock = node.lock
  const mastery = lock?.reason === "mastery"
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose()
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])
  return (
    <div
      className="dc-sheet-backdrop"
      role="presentation"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="dc-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dc-lock-title"
        data-testid="lock-sheet"
      >
        <p className="dc-eyebrow">{t("lock.eyebrow")}</p>
        <h2 id="dc-lock-title" className="mt-1 text-xl font-extrabold">
          {node.title}
        </h2>
        {mastery && lock?.current === undefined ? (
          <>
            <p className="mt-2 text-sm">{t("lock.masteryGeneric")}</p>
            <div className="mt-4 grid gap-2">
              <button type="button" className="dc-ghost" onClick={onClose}>
                {t("lock.close")}
              </button>
            </div>
          </>
        ) : mastery && lock?.current !== undefined && lock.target !== undefined ? (
          <>
            <p className="mt-2 text-sm">{t("lock.masteryBody", { needs: lock.needs ?? "", target: lock.target })}</p>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-sm font-bold">
                <span>{t("lock.yours")}</span>
                <span>
                  {lock.current}% / {lock.target}%
                </span>
              </div>
              <div className="dc-meter" role="meter" aria-valuenow={lock.current} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${lock.current}%` }} />
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <button type="button" className="dc-ghost" onClick={onClose}>
                {t("lock.close")}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm">
              {lock?.requires ? t("lock.audienceBody", { requires: lock.requires }) : t("lock.audienceGeneric")}
            </p>
            <div className="mt-4 grid gap-2">
              <button type="button" className="dc-ghost" onClick={onClose}>
                {t("lock.close")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** The learner's earned badges (`GET /v1/lms/badges/mine`); hidden until there is one. */
function BadgeStrip() {
  const t = useT("duo")
  const locale = useLocale()
  const { data } = useMyBadgeStrip()
  if (!data || data.earned.length === 0) return null
  return (
    <section className="dc-section" aria-labelledby="dc-badges">
      <h2 id="dc-badges" className="mb-3 text-lg font-extrabold">
        {t("path.badges")}
      </h2>
      <ul className="flex flex-wrap gap-3">
        {data.earned.map((award) => (
          <li key={award.award_id}>
            <BadgeMedal design={award.badge.design} size={56} label={localized(award.badge.name, locale)} />
          </li>
        ))}
      </ul>
    </section>
  )
}
