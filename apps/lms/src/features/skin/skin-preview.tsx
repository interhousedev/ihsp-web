"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import type { Skin } from "./skin"

/**
 * A small, non-interactive live sample of a skin. Each preview scopes its own `data-skin`: the Playful one carries
 * the real `--pl-*` tokens on a Classic page, the Classic one restores the palette (`--cl-*`) on a Playful page.
 */
export function SkinPreview({ skin }: { skin: Skin }) {
  const t = useT("skin")
  const playful = skin === "playful"
  return (
    <span
      aria-hidden
      data-skin={skin}
      className={cn(
        "bg-background text-foreground flex w-full flex-col gap-2 border p-3 text-left",
        playful ? "rounded-[var(--pl-radius-card)] border-2" : "rounded-md",
      )}
    >
      <span className={cn("text-sm", playful ? "font-extrabold" : "font-semibold")}>{t("preview.lesson")}</span>
      <span className={cn("bg-muted h-2 w-full overflow-hidden", playful ? "rounded-full" : "rounded-sm")}>
        <span className="bg-primary block h-full w-3/5" />
      </span>
      {playful ? (
        <span className="text-muted-foreground flex gap-2 text-xs font-bold">
          <span className="text-[var(--pl-streak-edge)]">{t("preview.streak")}</span>
          <span>{t("preview.xp")}</span>
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">{t("preview.progress")}</span>
      )}
      <span
        data-slot="button"
        className="bg-primary text-primary-foreground inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium"
      >
        {t("preview.continue")}
      </span>
    </span>
  )
}
