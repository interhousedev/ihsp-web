"use client"

import { useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icons,
  Input,
} from "@ihsp/ui"
import { TOUCH, TOUCH_ICON } from "../../shared/utils/touch"
import type { DayBlock } from "../utils/day-blocks"
import { EmisBadge } from "./emis-badge"

/**
 * One lesson block of a day: number, start, end and a menu. The menu resets a period from EMIS or removes the block;
 * the number of a period from EMIS is fixed.
 */
export function BellRow({
  block,
  onChange,
  onReset,
  onRemove,
}: {
  block: DayBlock
  onChange: (patch: Partial<DayBlock>) => void
  onReset: () => void
  onRemove: () => void
}) {
  const t = useT("terms.bells")
  const fromEmis = block.source !== "manual"
  const canReset = block.source === "override" && Boolean(block.emis_start && block.emis_end)

  return (
    <li className="flex flex-wrap items-end gap-x-3 gap-y-2 rounded-lg border p-2">
      <label className="flex w-16 flex-col gap-1 text-xs font-medium">
        {t("period")}
        <Input
          type="number"
          min={1}
          max={20}
          value={block.period}
          disabled={fromEmis}
          className={TOUCH}
          onChange={(event) => onChange({ period: Number(event.target.value) || 0 })}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        {t("start")}
        <Input
          type="time"
          value={block.start}
          className={TOUCH}
          onChange={(event) => onChange({ start: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        {t("end")}
        <Input
          type="time"
          value={block.end}
          className={TOUCH}
          onChange={(event) => onChange({ end: event.target.value })}
        />
      </label>
      <div className="ms-auto flex items-center gap-1">
        {block.source === "emis" ? <EmisBadge /> : null}
        {block.source === "override" ? (
          <Badge
            variant="secondary"
            title={t("overriddenHint", { start: block.emis_start ?? "", end: block.emis_end ?? "" })}
          >
            {t("overridden")}
          </Badge>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={TOUCH_ICON}
                aria-label={t("rowMenu", { period: block.period })}
              />
            }
          >
            <Icons.moreHorizontal aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {canReset ? (
              <DropdownMenuItem className="min-h-11 md:min-h-8" onClick={onReset}>
                {t("reset")}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem variant="destructive" className="min-h-11 md:min-h-8" onClick={onRemove}>
              {t("remove", { period: block.period })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}
