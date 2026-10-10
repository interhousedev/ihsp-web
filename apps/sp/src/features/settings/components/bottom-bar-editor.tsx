"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Switch } from "@ihsp/ui"
import { useBottomBar } from "../../shell/hooks/use-bottom-bar"
import { DESTINATION_IDS, MAX_BOTTOM_TABS, type DestinationId } from "../../shell/utils/bottom-bar"
import { moveCard } from "../../today/utils/today-cards"

/** Choose and reorder the pages of the phone bottom bar (up to four; "More" is always the last slot). Saved at once. */
export function BottomBarEditor() {
  const t = useT("settings.bottomNav")
  const tNav = useT("nav")
  const { ids, save } = useBottomBar()

  const rows = [
    ...ids.map((id) => ({ id, selected: true })),
    ...DESTINATION_IDS.filter((id) => !ids.includes(id)).map((id) => ({ id, selected: false })),
  ]
  const full = ids.length >= MAX_BOTTOM_TABS

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs">{t("slots", { count: ids.length, max: MAX_BOTTOM_TABS })}</p>
      <ul className="flex flex-col divide-y rounded-lg border">
        {rows.map(({ id, selected }) => {
          const index = ids.indexOf(id)
          const name = tNav(id)
          return (
            <li key={id} className="flex min-h-14 items-center gap-2 px-3">
              <Switch
                checked={selected}
                disabled={(!selected && full) || (selected && ids.length === 1)}
                aria-label={t("show", { page: name })}
                onCheckedChange={(on) => save(on ? [...ids, id] : ids.filter((other: DestinationId) => other !== id))}
              />
              <span className="min-w-0 flex-1 text-sm font-medium">{name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 md:size-8"
                disabled={!selected || index <= 0}
                aria-label={t("moveUp", { page: name })}
                onClick={() => save(moveCard(ids, index, -1))}
              >
                <Icons.chevronUp aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 md:size-8"
                disabled={!selected || index === ids.length - 1}
                aria-label={t("moveDown", { page: name })}
                onClick={() => save(moveCard(ids, index, 1))}
              >
                <Icons.chevronDown aria-hidden />
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
