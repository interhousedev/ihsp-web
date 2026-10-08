"use client"

import type { Block } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { newFlashcardsBlock, newTestBlock, newTextBlock } from "../utils/content-ops"

/** "Add block": text, test or flash cards (LMS-2). */
export function AddBlockBar({ onAdd }: { onAdd: (block: Block) => void }) {
  const t = useT("stepEditor")
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("addBlock")}>
      <span className="text-sm font-medium">{t("addBlock")}</span>
      <Button type="button" variant="outline" onClick={() => onAdd(newTextBlock())} className="min-h-11 md:min-h-8">
        <Icons.text aria-hidden />
        {t("blockTypes.text")}
      </Button>
      <Button type="button" variant="outline" onClick={() => onAdd(newTestBlock())} className="min-h-11 md:min-h-8">
        <Icons.forms aria-hidden />
        {t("blockTypes.test")}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => onAdd(newFlashcardsBlock())}
        className="min-h-11 md:min-h-8"
      >
        <Icons.flashcards aria-hidden />
        {t("blockTypes.flashcards")}
      </Button>
    </div>
  )
}
