"use client"

import { certAssetUrl, type CertField, type CertFieldKey, type CertTemplate } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { certFamily } from "../hooks/use-cert-fonts"
import {
  boxStyle,
  fontPx,
  moveBox,
  nudgeBox,
  pxToFraction,
  resizeBox,
  squareQr,
  type Box,
  type Handle,
} from "../utils/layout"
import { QrSketch } from "./qr-sketch"

const HANDLES: Handle[] = ["nw", "ne", "sw", "se"]
const HANDLE_POS: Record<Handle, string> = {
  nw: "-left-1.5 -top-1.5 cursor-nwse-resize",
  ne: "-right-1.5 -top-1.5 cursor-nesw-resize",
  sw: "-left-1.5 -bottom-1.5 cursor-nesw-resize",
  se: "-right-1.5 -bottom-1.5 cursor-nwse-resize",
}

type Drag = { index: number; handle: Handle | null; startX: number; startY: number; box: Box }

/**
 * The certificate as it will roughly print: the background with every field drawn in its font, colour and size. Fields
 * drag to move, corners drag to resize; the focused field moves with the arrow keys (Shift: larger steps, Alt: resize).
 */
export function CertCanvas({
  template,
  samples,
  selected,
  onSelect,
  onChange,
  onDragging,
}: {
  template: CertTemplate
  samples: Record<CertFieldKey, string>
  selected: number | null
  onSelect: (index: number | null) => void
  onChange: (index: number, field: CertField) => void
  onDragging: (dragging: boolean) => void
}) {
  const t = useT("courseCertificates")
  const frame = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const observer = new ResizeObserver(() => setHeight(el.clientHeight))
    observer.observe(el)
    setHeight(el.clientHeight)
    return () => observer.disconnect()
  }, [])

  function apply(index: number, box: Box) {
    const field = template.fields[index]
    if (!field) return
    const next = field.key === "qr" ? squareQr(box, template) : box
    onChange(index, { ...field, ...next })
  }

  function start(event: PointerEvent, index: number, handle: Handle | null) {
    const field = template.fields[index]
    if (!field || event.button !== 0) return
    event.stopPropagation()
    event.preventDefault()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    onSelect(index)
    drag.current = { index, handle, startX: event.clientX, startY: event.clientY, box: field }
    onDragging(true)
  }

  function move(event: PointerEvent) {
    const state = drag.current
    const rect = frame.current?.getBoundingClientRect()
    if (!state || !rect) return
    const { dx, dy } = pxToFraction(event.clientX - state.startX, event.clientY - state.startY, rect)
    apply(state.index, state.handle ? resizeBox(state.box, state.handle, dx, dy) : moveBox(state.box, dx, dy))
  }

  function end() {
    if (!drag.current) return
    drag.current = null
    onDragging(false)
  }

  function key(event: KeyboardEvent, index: number) {
    const field = template.fields[index]
    if (!field) return
    if (event.key === "Escape") {
      onSelect(null)
      return
    }
    const next = nudgeBox(field, event.key, { large: event.shiftKey, resize: event.altKey })
    if (!next) return
    event.preventDefault()
    apply(index, next)
  }

  return (
    <div
      ref={frame}
      className="bg-muted relative w-full touch-none overflow-hidden rounded-md border select-none"
      style={{ aspectRatio: `${template.width_px} / ${template.height_px}` }}
      onPointerDown={() => onSelect(null)}
    >
      {template.background_url ? (
        <img
          src={certAssetUrl(template.background_url)}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 size-full object-cover"
        />
      ) : (
        // A corner note, not a centred label: centred fields (the name) sit right where a centred label would be.
        <p className="text-muted-foreground bg-background/80 pointer-events-none absolute start-2 top-2 rounded px-2 py-0.5 text-xs">
          {t("design.noBackground")}
        </p>
      )}
      {template.fields.map((field, index) => {
        const active = index === selected
        const label = t(`field.${field.key}`)
        return (
          <div
            key={`${field.key}-${index}`}
            role="button"
            tabIndex={0}
            aria-label={t("design.fieldHandle", { field: label })}
            aria-pressed={active}
            onPointerDown={(event) => start(event, index, null)}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onFocus={() => onSelect(index)}
            onKeyDown={(event) => key(event, index)}
            className={cn(
              "absolute flex cursor-move items-center outline-none",
              active ? "ring-primary ring-2" : "hover:ring-primary/50 ring-1 ring-transparent ring-dashed",
              "focus-visible:ring-primary focus-visible:ring-2",
            )}
            style={boxStyle(field)}
          >
            {field.key === "qr" ? (
              <QrSketch qr={template.qr} className="size-full" />
            ) : (
              <span
                className="w-full overflow-hidden leading-tight whitespace-nowrap"
                style={{
                  fontFamily: `${certFamily(field.font)}, serif`,
                  fontSize: `${fontPx(field.size, height)}px`,
                  fontWeight: field.weight,
                  color: field.color,
                  textAlign: field.align,
                }}
              >
                {field.key === "custom_text" ? field.text || label : samples[field.key]}
              </span>
            )}
            {active
              ? HANDLES.map((handle) => (
                  <span
                    key={handle}
                    aria-hidden
                    onPointerDown={(event) => start(event, index, handle)}
                    onPointerMove={move}
                    onPointerUp={end}
                    onPointerCancel={end}
                    className={cn(
                      "bg-background border-primary absolute size-3 rounded-full border-2 pointer-coarse:size-5",
                      HANDLE_POS[handle],
                    )}
                  />
                ))
              : null}
          </div>
        )
      })}
    </div>
  )
}
