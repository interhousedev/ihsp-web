"use client"

import { useT } from "@ihsp/i18n"
import { Button, ToggleGroup, ToggleGroupItem } from "@ihsp/ui"
import { IconMinus, IconPlus } from "@tabler/icons-react"
import {
  FONT_SIZE_RANGE,
  LINE_HEIGHTS,
  ZOOM_RANGE,
  stepZoom,
  type EpubFlow,
  type PageFit,
  type ReaderSettings,
} from "./lib/reader-settings"
import { ReaderSheet } from "./reader-sheet"

export type SettingsPanelProps = {
  open: boolean
  onOpenChange(open: boolean): void
  /** `pdf` has page fit and zoom, the others have text size and line height; `epub` also has the layout. */
  format: "pdf" | "epub" | "text"
  settings: ReaderSettings
  onChange(patch: Partial<ReaderSettings>): void
}

const SHORTCUTS = ["next", "prev", "search", "goto", "highlight", "note", "bookmark", "zoom", "escape"] as const

function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
  decreaseDisabled,
  increaseDisabled,
  decreaseLabel,
  increaseLabel,
}: {
  label: string
  value: string
  onDecrease(): void
  onIncrease(): void
  decreaseDisabled: boolean
  increaseDisabled: boolean
  decreaseLabel: string
  increaseLabel: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={decreaseLabel}
          disabled={decreaseDisabled}
          className="size-11 md:size-8"
          onClick={onDecrease}
        >
          <IconMinus aria-hidden />
        </Button>
        <output aria-live="polite" className="w-14 text-center text-sm tabular-nums">
          {value}
        </output>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={increaseLabel}
          disabled={increaseDisabled}
          className="size-11 md:size-8"
          onClick={onIncrease}
        >
          <IconPlus aria-hidden />
        </Button>
      </div>
    </div>
  )
}

/** Reading settings, remembered on this device: page fit and zoom (PDF), text size, line height and layout (reflow). */
export function SettingsPanel({ open, onOpenChange, format, settings, onChange }: SettingsPanelProps) {
  const t = useT("library.reader")
  return (
    <ReaderSheet open={open} onOpenChange={onOpenChange} title={t("settings")} description={t("settingsHint")}>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
        {format === "pdf" ? (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t("pageFit")}</span>
              <ToggleGroup
                aria-label={t("pageFit")}
                value={[settings.pageFit]}
                onValueChange={(value) => {
                  const next = value[0]
                  if (next === "width" || next === "page") onChange({ pageFit: next satisfies PageFit })
                }}
              >
                <ToggleGroupItem value="width" className="min-h-11 px-4 md:min-h-8">
                  {t("fitWidth")}
                </ToggleGroupItem>
                <ToggleGroupItem value="page" className="min-h-11 px-4 md:min-h-8">
                  {t("fitPage")}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <Stepper
              label={t("zoom")}
              value={`${Math.round(settings.zoom * 100)}%`}
              decreaseLabel={t("zoomOut")}
              increaseLabel={t("zoomIn")}
              decreaseDisabled={settings.zoom <= ZOOM_RANGE.min}
              increaseDisabled={settings.zoom >= ZOOM_RANGE.max}
              onDecrease={() => onChange({ pageFit: "custom", zoom: stepZoom(settings.zoom, -1) })}
              onIncrease={() => onChange({ pageFit: "custom", zoom: stepZoom(settings.zoom, 1) })}
            />
          </>
        ) : (
          <>
            <Stepper
              label={t("fontSize")}
              value={`${settings.fontSize}%`}
              decreaseLabel={t("smaller")}
              increaseLabel={t("larger")}
              decreaseDisabled={settings.fontSize <= FONT_SIZE_RANGE.min}
              increaseDisabled={settings.fontSize >= FONT_SIZE_RANGE.max}
              onDecrease={() => onChange({ fontSize: settings.fontSize - FONT_SIZE_RANGE.step })}
              onIncrease={() => onChange({ fontSize: settings.fontSize + FONT_SIZE_RANGE.step })}
            />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t("lineHeight")}</span>
              <ToggleGroup
                aria-label={t("lineHeight")}
                value={[String(settings.lineHeight)]}
                onValueChange={(value) => {
                  const next = Number(value[0])
                  if ((LINE_HEIGHTS as readonly number[]).includes(next)) onChange({ lineHeight: next })
                }}
              >
                {LINE_HEIGHTS.map((height, index) => (
                  <ToggleGroupItem key={height} value={String(height)} className="min-h-11 px-4 md:min-h-8">
                    {t(`lineHeights.${index}`)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </>
        )}
        {format === "epub" ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("flow")}</span>
            <ToggleGroup
              aria-label={t("flow")}
              value={[settings.flow]}
              onValueChange={(value) => {
                const next = value[0]
                if (next === "paginated" || next === "scrolled") onChange({ flow: next satisfies EpubFlow })
              }}
            >
              <ToggleGroupItem value="paginated" className="min-h-11 px-4 md:min-h-8">
                {t("flowPaginated")}
              </ToggleGroupItem>
              <ToggleGroupItem value="scrolled" className="min-h-11 px-4 md:min-h-8">
                {t("flowScrolled")}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        ) : null}
        <section aria-labelledby="reader-shortcuts" className="flex flex-col gap-2">
          <h3 id="reader-shortcuts" className="text-sm font-medium">
            {t("shortcuts.title")}
          </h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            {SHORTCUTS.map((name) => (
              <div key={name} className="contents">
                <dt className="font-mono text-xs">{t(`shortcuts.${name}.keys`)}</dt>
                <dd className="text-muted-foreground">{t(`shortcuts.${name}.action`)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </ReaderSheet>
  )
}
