"use client"

import type { InfographicContent } from "@ihsp/api"
import type { Ref } from "react"
import { InfographicBlockView } from "./blocks/infographic-block"
import {
  CANVAS_SIZES,
  GRID_COLUMNS,
  THEMES,
  themeStyle,
  type InfographicOrientation,
  type InfographicStyle,
} from "./infographic-theme"

type InfographicCanvasProps = {
  content: InfographicContent
  orientation: InfographicOrientation
  /** The visual theme (`options.style`). */
  variant: InfographicStyle
  /** Shrinks the content when it is taller than the canvas (see `measureContentScale`); 1 leaves it alone. */
  contentScale?: number
  ref?: Ref<HTMLDivElement>
}

/**
 * The infographic at its fixed size (800 x 1200, 1200 x 800 or 1000 x 1000 CSS pixels): title, subtitle, the blocks in
 * order on a grid, and the footer. The theme is a set of CSS variables on the root, so the blocks do not know the style.
 */
export function InfographicCanvas({ content, orientation, variant, contentScale = 1, ref }: InfographicCanvasProps) {
  const { width, height } = CANVAS_SIZES[orientation]
  const columns = GRID_COLUMNS[orientation]
  const theme = THEMES[variant]
  return (
    <div
      ref={ref}
      data-testid="infographic-canvas"
      data-orientation={orientation}
      data-style={variant}
      style={{ ...themeStyle(variant), width, height }}
      className="flex flex-col overflow-hidden bg-(--ig-bg) p-[44px] font-(family-name:--ig-font) text-(--ig-ink)"
    >
      <div
        data-ig-content
        className="flex min-h-0 flex-1 flex-col gap-[22px]"
        style={
          contentScale < 1
            ? { transform: `scale(${contentScale})`, transformOrigin: "0 0", width: `${100 / contentScale}%` }
            : undefined
        }
      >
        <header className="flex flex-col gap-[10px]">
          <h2 className="font-(family-name:--ig-title-font) text-[42px] leading-[1.1] font-extrabold [overflow-wrap:anywhere]">
            {content.title}
          </h2>
          {content.subtitle ? <p className="text-[21px] leading-[1.3] text-(--ig-muted)">{content.subtitle}</p> : null}
          <span aria-hidden className="mt-[6px] block h-[6px] w-[96px] rounded-full bg-(--ig-accent)" />
        </header>
        <div
          className="grid flex-1 grid-flow-row-dense content-start gap-[18px]"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {content.blocks.map((block, index) => (
            <InfographicBlockView key={index} block={block} index={index} tones={theme.tones} />
          ))}
        </div>
        {content.footer ? (
          <footer className="border-t-[2px] border-(--ig-line) pt-[12px] text-[15px] text-(--ig-muted)">
            {content.footer}
          </footer>
        ) : null}
      </div>
    </div>
  )
}
