"use client"

import type { DashboardWidgetSize } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { WIDGET_SIZES, type Widget } from "../model"
import { ColorPicker } from "./color-picker"

/** The controls of the selected tile: size (only the sizes its kind allows), colour and delete. */
export function WidgetEditor({
  widget,
  onResize,
  onColor,
  onRemove,
}: {
  widget: Widget
  onResize: (size: DashboardWidgetSize) => void
  onColor: (color: string | null) => void
  onRemove: () => void
}) {
  const t = useT("today.dashboard")
  return (
    <div role="region" aria-label={t("editor")} className="bg-card flex flex-col gap-3 rounded-2xl border p-3">
      <h3 className="text-sm font-semibold">{t(`kinds.${widget.kind}`)}</h3>
      <div role="group" aria-label={t("size")} className="flex flex-wrap gap-2">
        {WIDGET_SIZES[widget.kind].map((size) => (
          <Button
            key={size}
            type="button"
            size="sm"
            variant={widget.size === size ? "default" : "outline"}
            aria-pressed={widget.size === size}
            onClick={() => onResize(size)}
          >
            {size}
          </Button>
        ))}
      </div>
      <ColorPicker value={widget.color} onChange={onColor} />
      <Button type="button" variant="destructive" size="sm" className="self-start" onClick={onRemove}>
        <Icons.trash aria-hidden />
        {t("remove")}
      </Button>
    </div>
  )
}
