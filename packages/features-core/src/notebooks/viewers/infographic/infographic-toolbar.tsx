"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { IconCopy, IconDownload, IconMaximize, IconPrinter } from "@ihsp/ui"
import { MAX_ZOOM, MIN_ZOOM } from "./fit-scale"

/** Icon-only 44 px buttons on phones (the text stays for screen readers), icon and text from `sm`. */
const ICON_ON_PHONE = "min-h-11 min-w-11 sm:min-h-8 sm:min-w-0 md:min-h-8"

type InfographicToolbarProps = {
  scale: number
  isFit: boolean
  busy: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onDownload: () => void
  onPrint: () => void
  onCopy: () => void
}

/** Zoom out, the zoom value, zoom in, Fit; then Download PNG, Print / PDF and Copy text. */
export function InfographicToolbar({
  scale,
  isFit,
  busy,
  onZoomIn,
  onZoomOut,
  onFit,
  onDownload,
  onPrint,
  onCopy,
}: InfographicToolbarProps) {
  const t = useT("notebooks.infographic")
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label={t("zoom")} className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label={t("zoomOut")}
          disabled={scale <= MIN_ZOOM}
          onClick={onZoomOut}
        >
          <Icons.minus aria-hidden />
        </Button>
        <span aria-live="polite" data-testid="zoom-value" className="min-w-12 text-center text-sm tabular-nums">
          {t("zoomValue", { percent: Math.round(scale * 100) })}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label={t("zoomIn")}
          disabled={scale >= MAX_ZOOM}
          onClick={onZoomIn}
        >
          <Icons.add aria-hidden />
        </Button>
        <Button
          type="button"
          variant={isFit ? "secondary" : "outline"}
          className={ICON_ON_PHONE}
          aria-pressed={isFit}
          title={t("fit")}
          onClick={onFit}
        >
          <IconMaximize aria-hidden />
          <span className="sr-only sm:not-sr-only">{t("fit")}</span>
        </Button>
      </div>
      <Button type="button" className="min-h-11 md:min-h-8" disabled={busy} onClick={onDownload}>
        {busy ? <Icons.spinner className="animate-spin" aria-hidden /> : <IconDownload aria-hidden />}
        {busy ? t("preparing") : t("png")}
      </Button>
      <Button type="button" variant="outline" className={ICON_ON_PHONE} title={t("print")} onClick={onPrint}>
        <IconPrinter aria-hidden />
        <span className="sr-only sm:not-sr-only">{t("print")}</span>
      </Button>
      <Button type="button" variant="outline" className={ICON_ON_PHONE} title={t("copy")} onClick={onCopy}>
        <IconCopy aria-hidden />
        <span className="sr-only sm:not-sr-only">{t("copy")}</span>
      </Button>
    </div>
  )
}
