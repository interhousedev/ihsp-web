"use client"

import type { Block } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Card, CardContent, Icons } from "@ihsp/ui"
import type { ReactNode } from "react"

/** The frame of one block in the step editor: type, move up / down, delete. */
export function BlockCard({
  type,
  index,
  total,
  onMove,
  onRemove,
  children,
}: {
  type: Block["type"]
  index: number
  total: number
  onMove: (direction: "up" | "down") => void
  onRemove: () => void
  children: ReactNode
}) {
  const t = useT("stepEditor")
  return (
    <Card data-block-type={type}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            {index + 1}. {t(`blockTypes.${type}`)}
          </h3>
          <div className="flex">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={index === 0}
              onClick={() => onMove("up")}
              aria-label={t("moveBlockUp", { number: index + 1 })}
              className="size-11 md:size-8"
            >
              <Icons.chevronUp aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={index === total - 1}
              onClick={() => onMove("down")}
              aria-label={t("moveBlockDown", { number: index + 1 })}
              className="size-11 md:size-8"
            >
              <Icons.chevronDown aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label={t("removeBlock", { number: index + 1 })}
              className="size-11 md:size-8"
            >
              <Icons.trash aria-hidden />
            </Button>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}
