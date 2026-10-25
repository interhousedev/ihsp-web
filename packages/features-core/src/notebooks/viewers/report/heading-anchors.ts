"use client"

import { useLayoutEffect, type RefObject } from "react"

export type HeadingRef = { text: string; id: string }

const normalize = (text: string) =>
  text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "")

/**
 * For every heading found in the rendered report (in document order) the `id` of the matching entry of
 * `content.headings`, or `null`. Entries are consumed in order, so repeated titles map to their own entries; the
 * comparison ignores case, punctuation and Markdown marks.
 */
export function matchHeadings(rendered: readonly string[], headings: readonly HeadingRef[]): (string | null)[] {
  let cursor = 0
  return rendered.map((text) => {
    const wanted = normalize(text)
    for (let index = cursor; index < headings.length; index += 1) {
      const heading = headings[index]
      if (heading && normalize(heading.text) === wanted) {
        cursor = index + 1
        return heading.id
      }
    }
    return null
  })
}

/** The DOM id a heading of the report gets (the prefix keeps ids unique when two reports are mounted). */
export const anchorId = (prefix: string, headingId: string) => `${prefix}${headingId}`

/** The heading's text without the citation chips inside it. */
function textOf(heading: HTMLElement): string {
  const copy = heading.cloneNode(true) as HTMLElement
  for (const chip of copy.querySelectorAll("button")) chip.remove()
  return copy.textContent ?? ""
}

/**
 * The Markdown renderer gives headings no ids, so after each render the headings are found in the DOM and matched to
 * `content.headings`; matched ones get an id (for the Contents links), a `tabindex` (so a jump can focus them) and a
 * scroll margin.
 */
export function useHeadingAnchors(
  root: RefObject<HTMLElement | null>,
  headings: readonly HeadingRef[],
  prefix: string,
): void {
  // After every render: the headings are new nodes whenever the Markdown changes, and the pass is cheap and idempotent.
  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const rendered = Array.from(element.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"))
    const ids = matchHeadings(rendered.map(textOf), headings)
    rendered.forEach((heading, index) => {
      const id = ids[index]
      if (!id) return
      heading.id = anchorId(prefix, id)
      heading.tabIndex = -1
      heading.classList.add("scroll-mt-4", "outline-hidden")
    })
  })
}

/** Scrolls to a heading of the report and moves the focus there (smooth unless the student prefers less motion). */
export function scrollToHeading(elementId: string): void {
  const heading = document.getElementById(elementId)
  if (!heading) return
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  heading.scrollIntoView?.({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
  heading.focus({ preventScroll: true })
}
