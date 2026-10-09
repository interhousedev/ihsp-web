"use client"

import type { AnnotationColor } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { ANNOTATION_COLORS, COLOR_ICONS, COLOR_TEXT } from "./lib/colors"

/**
 * The four highlight colours as a radio group. Each one has its own shape as well as its colour, so the choice never
 * depends on colour vision (docs/reference/study-library.md § 9.4). Touch targets are 44 px on phones.
 */
export function ColorPicker({
  value,
  onChange,
  label,
  className,
}: {
  value: AnnotationColor
  onChange(color: AnnotationColor): void
  label?: string
  className?: string
}) {
  const t = useT("library.annotation")
  return (
    <div role="radiogroup" aria-label={label ?? t("colorLabel")} className={cn("flex items-center gap-1", className)}>
      {ANNOTATION_COLORS.map((color) => {
        const Icon = COLOR_ICONS[color]
        const selected = color === value
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(`color.${color}`)}
            title={t(`color.${color}`)}
            onClick={() => onChange(color)}
            className={cn(
              "focus-visible:ring-ring flex size-11 items-center justify-center rounded-full border-2 transition-colors outline-none focus-visible:ring-2 md:size-8",
              selected ? "border-foreground" : "border-transparent hover:bg-muted",
            )}
          >
            <Icon className={cn("size-5 md:size-4", COLOR_TEXT[color])} aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
