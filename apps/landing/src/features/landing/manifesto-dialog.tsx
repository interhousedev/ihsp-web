"use client"

import { useT } from "@ihsp/i18n"
import { IconX } from "@ihsp/ui"
import { useEffect, useId, useRef } from "react"
import { focusables, useModal } from "./use-modal"

const PRINCIPLES = ["p1", "p2", "p3", "p4", "p5"] as const

/** The principles of the platform in a modal sheet; focus returns to the opener when it closes. */
export function ManifestoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT("landing.manifesto")
  const titleId = useId()
  const sheet = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useModal({ open, onClose, getFocusable: () => focusables(sheet.current) })

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButton.current?.focus()
    return () => opener?.focus()
  }, [open])

  if (!open) return null
  return (
    <div
      className="mf-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div ref={sheet} role="dialog" aria-modal="true" aria-labelledby={titleId} className="mf-sheet">
        <h2 id={titleId} className="lnd-h2">
          {t("title")}
        </h2>
        <button ref={closeButton} type="button" aria-label={t("close")} onClick={onClose} className="mf-close">
          <IconX aria-hidden className="size-5" />
        </button>
        <ol className="mf-list">
          {PRINCIPLES.map((key) => (
            <li key={key}>
              <h3>{t(`${key}.title`)}</h3>
              <p>{t(`${key}.text`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
