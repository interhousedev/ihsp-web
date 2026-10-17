"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Switch } from "@ihsp/ui"
import type { SettingsForm } from "../hooks/use-settings-form"
import { moveItem } from "../utils/validate"

/** The tabs a learner sees in the course: reorder with the arrows, hide with the switch. */
export function NavigationTab({ form }: { form: SettingsForm }) {
  const t = useT("courseSettings")
  const values = form.values
  if (!values) return null
  const items = values.navigation
  const set = (navigation: typeof items) => form.update({ navigation })
  return (
    <ol aria-label={t("navigation")} className="flex flex-col gap-2">
      {items.map((item, index) => {
        const name = t(`nav.${item.key}`)
        return (
          <li key={item.key} className="flex items-center gap-2 rounded-lg border px-3 py-1">
            <span className={item.hidden ? "text-muted-foreground flex-1 text-sm line-through" : "flex-1 text-sm"}>
              {name}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={t("moveUp", { name })}
              disabled={index === 0}
              onClick={() => set(moveItem(items, index, -1))}
              className="size-11 md:size-8"
            >
              <Icons.chevronUp aria-hidden />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={t("moveDown", { name })}
              disabled={index === items.length - 1}
              onClick={() => set(moveItem(items, index, 1))}
              className="size-11 md:size-8"
            >
              <Icons.chevronDown aria-hidden />
            </Button>
            <Switch
              checked={!item.hidden}
              aria-label={t("showTab", { name })}
              onCheckedChange={(shown) =>
                set(items.map((entry) => (entry.key === item.key ? { ...entry, hidden: !shown } : entry)))
              }
            />
          </li>
        )
      })}
    </ol>
  )
}
