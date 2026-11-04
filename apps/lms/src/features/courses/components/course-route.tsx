"use client"

import { getLmsCourseQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useSyncExternalStore, type MouseEvent } from "react"
import { StepPlayer } from "../../player/components/step-player"
import { MissingParam } from "../../shared/components/missing-param"
import { isPlayerPath, resolveCourseUrl } from "../../shared/utils/course-path"
import { hrefs } from "../../shared/utils/hrefs"
import { continueStep } from "../../shared/utils/outline"
import { LearnerShell } from "../../shell/components/learner-shell"
import { LmsShell } from "../../shell/components/lms-shell"
import { PageLoading } from "../../shell/components/page-loading"
import { CoursePage } from "./course-page"

const LOCATION_CHANGED = "lms:course-location"

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener)
  window.addEventListener(LOCATION_CHANGED, listener)
  return () => {
    window.removeEventListener("popstate", listener)
    window.removeEventListener(LOCATION_CHANGED, listener)
  }
}

/** The address, read in the browser only: the shell is prerendered without one. */
function useBrowserUrl(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => window.location.pathname + window.location.search,
    () => null,
  )
}

/** Next has no page for an id in the path, so the shell changes the address itself; Next keeps its hooks in sync. */
function moveTo(href: string, mode: "push" | "replace") {
  if (mode === "push") window.history.pushState(null, "", href)
  else window.history.replaceState(null, "", href)
  window.dispatchEvent(new Event(LOCATION_CHANGED))
}

/** Lesson links stay inside the shell: a plain click does not load a document (nor leave full screen). */
function keepStepLinksInShell(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return
  const anchor = (event.target as Element).closest?.("a[href]")
  if (!(anchor instanceof HTMLAnchorElement) || (anchor.target && anchor.target !== "_self")) return
  const url = new URL(anchor.href)
  if (url.origin !== window.location.origin || !isPlayerPath(url.pathname)) return
  event.preventDefault()
  moveTo(url.pathname + url.search, "push")
}

/**
 * Opening a course without a step: whoever can learn it goes straight to the step to continue; the others, and a course
 * without lessons, see the landing with the Enroll button.
 */
function CourseEntry({ courseRef, preview }: { courseRef: string; preview: boolean }) {
  const course = useQuery({ ...getLmsCourseQuery(courseRef), enabled: !preview, retry: false })
  const page = course.data
  const target = !preview && page && (page.enrolled || page.can_edit) ? continueStep(page.outline) : null

  useEffect(() => {
    if (!page || !target) return
    moveTo(hrefs.step(page.id, target.step_id) + window.location.search, "replace")
  }, [page, target])

  if (target || (!preview && course.isPending)) return <PageLoading />
  return (
    <LmsShell>
      <CoursePage slug={page?.slug ?? courseRef} preview={preview} />
    </LmsShell>
  )
}

/** Every `/course/...` address, new and old, is drawn here. */
export function CourseRoute() {
  const url = useBrowserUrl()
  const [pathname = "", search = ""] =
    url === null ? [] : [url.split("?")[0], url.includes("?") ? `?${url.split("?")[1]}` : ""]
  const target = url === null ? null : resolveCourseUrl(pathname, search)
  const redirect = target?.kind === "redirect" ? target.href : null

  useEffect(() => {
    if (redirect) moveTo(redirect, "replace")
  }, [redirect])

  if (target === null || target.kind === "redirect") return <PageLoading />
  if (target.kind === "missing") {
    return (
      <LmsShell>
        <MissingParam />
      </LmsShell>
    )
  }
  if (target.kind === "entry") return <CourseEntry courseRef={target.ref} preview={target.preview} />
  return (
    <div className="contents" onClickCapture={keepStepLinksInShell}>
      <LearnerShell>
        <StepPlayer
          key={target.stepId}
          courseId={target.courseId}
          stepId={target.stepId}
          slug={null}
          block={target.block}
          mode="learn"
        />
      </LearnerShell>
    </div>
  )
}
