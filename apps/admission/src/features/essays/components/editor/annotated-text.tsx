"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { Fragment, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type Ref } from "react"
import type { DeepRead, ParagraphStrength } from "../../flow/steps-api"
import { locateMoments, splitParagraphs } from "./paragraphs"

const STRIPE: Record<ParagraphStrength, string> = {
  strong: "bg-success",
  ok: "bg-muted-foreground/50",
  weak: "bg-warning",
}

type Stripe = { n: number; top: number; height: number }

/** Classes shared by the textarea and the mirror behind it; they must wrap the text identically. */
const TEXT = "m-0 w-full border-0 p-0 text-base leading-relaxed font-[inherit] whitespace-pre-wrap break-words"

/**
 * The essay text with the deep read laid on it: a stripe beside every paragraph (colour = strength, tap = open it in
 * the read panel) and the memorable moments marked by quote match. The textarea stays the only editable surface; a
 * transparent mirror with identical wrapping carries the marks, and the stripes are measured from it.
 */
export function AnnotatedText({
  body,
  readOnly,
  onBody,
  textareaRef,
  read,
  stale,
  selected,
  onSelect,
}: {
  body: string
  readOnly: boolean
  onBody: (value: string) => void
  textareaRef?: Ref<HTMLTextAreaElement>
  read: DeepRead | null
  /** The text changed after the reading: the stripes are dimmed. */
  stale: boolean
  selected: number | null
  onSelect: (paragraph: number) => void
}) {
  const t = useT("essayEditor")
  const tf = useT("essayFlow")
  const wrap = useRef<HTMLDivElement>(null)
  const area = useRef<HTMLTextAreaElement | null>(null)
  const mirror = useRef<HTMLDivElement>(null)
  const [stripes, setStripes] = useState<Stripe[]>([])

  const spans = useMemo(() => splitParagraphs(body), [body])
  const moments = useMemo(() => (read ? locateMoments(body, read, spans) : []), [body, read, spans])

  const nodes = useMemo(() => {
    if (!read) return null
    const out: ReactNode[] = []
    let cursor = 0
    spans.forEach((p, i) => {
      if (p.start > cursor) out.push(body.slice(cursor, p.start))
      const inside = moments.filter((m) => m.start >= p.start && m.end <= p.end)
      const parts: ReactNode[] = []
      let at = p.start
      for (const m of inside) {
        if (m.start > at) parts.push(body.slice(at, m.start))
        parts.push(
          <mark key={m.start} data-moment={m.kind} className="bg-success/25 rounded-sm text-transparent">
            {body.slice(m.start, m.end)}
          </mark>,
        )
        at = m.end
      }
      if (at < p.end) parts.push(body.slice(at, p.end))
      out.push(
        <span
          key={i}
          data-para={p.n}
          className={selected === p.n ? "bg-primary/10 rounded-sm" : undefined}
        >
          {parts.map((x, k) => (
            <Fragment key={k}>{x}</Fragment>
          ))}
        </span>,
      )
      cursor = p.end
    })
    if (cursor < body.length) out.push(body.slice(cursor))
    return out
  }, [body, read, spans, moments, selected])

  useLayoutEffect(() => {
    const el = area.current
    const box = wrap.current
    if (!el || !box) return
    const measure = () => {
      el.style.height = "auto"
      el.style.height = `${Math.max(el.scrollHeight, 448)}px`
      if (!mirror.current || !read) {
        setStripes((old) => (old.length ? [] : old))
        return
      }
      const top = box.getBoundingClientRect().top
      const next: Stripe[] = []
      mirror.current.querySelectorAll<HTMLElement>("[data-para]").forEach((node) => {
        const rects = Array.from(node.getClientRects())
        if (rects.length === 0) return
        const from = Math.min(...rects.map((r) => r.top)) - top
        const to = Math.max(...rects.map((r) => r.bottom)) - top
        next.push({ n: Number(node.dataset.para), top: Math.round(from), height: Math.round(to - from) })
      })
      setStripes((old) => (JSON.stringify(old) === JSON.stringify(next) ? old : next))
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    return () => observer.disconnect()
  }, [body, read, nodes])

  const paragraphOf = (n: number) => read?.paragraphs.find((p) => p.paragraph === n)

  return (
    <div ref={wrap} className="relative" data-testid="essay-text">
      {nodes ? (
        <div ref={mirror} aria-hidden className={cn(TEXT, "pointer-events-none absolute inset-0 text-transparent")}>
          {nodes}
        </div>
      ) : null}
      <textarea
        id="essay-body"
        ref={(node) => {
          area.current = node
          if (typeof textareaRef === "function") textareaRef(node)
          else if (textareaRef) textareaRef.current = node
        }}
        aria-label={t("textLabel")}
        aria-describedby="essay-count essay-save"
        className={cn(TEXT, "relative block min-h-[28rem] resize-none bg-transparent outline-none")}
        value={body}
        readOnly={readOnly}
        spellCheck
        onChange={(event) => onBody(event.target.value)}
      />
      {read
        ? stripes.map((s) => {
            const p = paragraphOf(s.n)
            if (!p) return null
            const label = t("stripe", {
              n: s.n,
              role: tf(`deep.roles.${p.role}` as "deep.roles.hook"),
              strength: tf(`deep.strength.${p.strength}` as "deep.strength.ok"),
            })
            return (
              <button
                key={s.n}
                type="button"
                aria-label={label}
                aria-pressed={selected === s.n}
                title={label}
                data-testid={`stripe-${s.n}`}
                onClick={() => onSelect(s.n)}
                style={{ top: s.top, height: s.height }}
                className={cn(
                  "group absolute -left-5 flex w-4 justify-center md:-left-9 md:w-6",
                  stale && "opacity-40",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-full w-1 rounded-full transition-[width]",
                    STRIPE[p.strength],
                    selected === s.n ? "w-1.5" : "group-hover:w-1.5",
                  )}
                />
              </button>
            )
          })
        : null}
    </div>
  )
}
