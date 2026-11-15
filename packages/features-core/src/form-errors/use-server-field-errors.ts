"use client"

import { getFieldIssues } from "@ihsp/api"
import { useErrorMessage } from "@ihsp/i18n"
import { useEffect, useRef, type RefObject } from "react"

const MARK = "data-server-field-error"

function camel(name: string): string {
  return name.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase())
}

/** Names a form control may carry for a backend field: `ends_on`, `endsOn`, `ends-on`, and the last path part. */
export function fieldCandidates(field: string): string[] {
  const last = field.split(".").pop() ?? field
  return [...new Set([field, camel(field), field.replace(/_/g, "-"), last, camel(last), last.replace(/_/g, "-")])]
}

/** The control of `field` inside `root`: by `name`, `data-field`, `id`, or an `id` that ends with `-<name>`. */
export function findFieldControl(root: HTMLElement, field: string): HTMLElement | null {
  for (const name of fieldCandidates(field)) {
    const safe = name.replace(/["\\]/g, "\\$&")
    const hit = root.querySelector<HTMLElement>(
      `[name="${safe}"], [data-field="${safe}"], [id="${safe}"], [id$="-${safe}"]`,
    )
    if (hit) return hit
  }
  return null
}

function clearMarks(root: HTMLElement) {
  root.querySelectorAll(`[${MARK}]`).forEach((node) => node.remove())
  root.querySelectorAll<HTMLElement>("[data-server-invalid]").forEach((control) => {
    control.removeAttribute("aria-invalid")
    control.removeAttribute("data-server-invalid")
    const ids = (control.getAttribute("aria-describedby") ?? "").split(" ").filter((id) => id && !id.startsWith("sfe-"))
    if (ids.length > 0) control.setAttribute("aria-describedby", ids.join(" "))
    else control.removeAttribute("aria-describedby")
  })
}

/**
 * Shows a failed request on the form field the backend names (`params.field`, `params.fields` or FastAPI `loc`):
 * the control gets `aria-invalid` and an inline message under it, the first one is focused and scrolled into view,
 * and the mark disappears when the user edits that control. The form's own summary stays as it is.
 *
 * Attach `ref` to the `<form>` and pass the mutation error. Controls are found by `name`, `data-field` or an id that
 * ends with the field name, so ids like `${useId()}-reason` work without extra wiring.
 */
export function useServerFieldErrors(error: unknown): { ref: RefObject<HTMLFormElement | null> } {
  const ref = useRef<HTMLFormElement | null>(null)
  const errorMessage = useErrorMessage()
  const message = error ? errorMessage(error) : ""

  useEffect(() => {
    const root = ref.current
    if (!root) return
    clearMarks(root)
    if (!error) return
    const cleanups: Array<() => void> = []
    let first: HTMLElement | null = null
    getFieldIssues(error).forEach((issue, index) => {
      const control = findFieldControl(root, issue.field)
      if (!control || control.hasAttribute("data-server-invalid")) return
      const id = `sfe-${control.id || index}-${index}`
      const note = root.ownerDocument.createElement("p")
      note.id = id
      note.setAttribute(MARK, "")
      note.setAttribute("role", "alert")
      note.className = "text-destructive text-sm"
      note.textContent = message
      control.insertAdjacentElement("afterend", note)
      control.setAttribute("aria-invalid", "true")
      control.setAttribute("data-server-invalid", "")
      control.setAttribute("aria-describedby", [control.getAttribute("aria-describedby"), id].filter(Boolean).join(" "))
      const clear = () => {
        note.remove()
        control.removeAttribute("aria-invalid")
        control.removeAttribute("data-server-invalid")
        control.setAttribute(
          "aria-describedby",
          (control.getAttribute("aria-describedby") ?? "")
            .split(" ")
            .filter((part) => part && part !== id)
            .join(" "),
        )
        if (!control.getAttribute("aria-describedby")) control.removeAttribute("aria-describedby")
      }
      control.addEventListener("input", clear, { once: true })
      control.addEventListener("change", clear, { once: true })
      cleanups.push(() => {
        control.removeEventListener("input", clear)
        control.removeEventListener("change", clear)
      })
      first ??= control
    })
    const target = first as HTMLElement | null
    if (target) {
      target.focus({ preventScroll: true })
      target.scrollIntoView?.({ block: "center", behavior: "smooth" })
    }
    return () => cleanups.forEach((run) => run())
  }, [error, message])

  return { ref }
}
