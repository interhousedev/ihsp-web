"use client"

import type { PromptSlot } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import { slotKey, summaryKey } from "../utils"

/** Every editable slot, grouped by the AI task it belongs to. */
export function PromptList({
  slots,
  selected,
  onSelect,
}: {
  slots: PromptSlot[]
  selected: string | null
  onSelect: (key: string) => void
}) {
  const t = useT("prompts")
  const byTask = new Map<string, PromptSlot[]>()
  for (const slot of slots) byTask.set(slot.task, [...(byTask.get(slot.task) ?? []), slot])
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("list.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {[...byTask.entries()].map(([task, items]) => (
          <section key={task} aria-labelledby={`prompt-task-${task}`} className="flex flex-col gap-1">
            <h3 id={`prompt-task-${task}`} className="text-muted-foreground text-xs font-semibold uppercase">
              {task}
            </h3>
            <ul className="flex flex-col gap-1">
              {items.map((slot) => (
                <li key={slotKey(slot)}>
                  <Button
                    type="button"
                    variant={selected === slotKey(slot) ? "secondary" : "ghost"}
                    className="h-auto w-full justify-between gap-2 py-2 text-start whitespace-normal"
                    aria-pressed={selected === slotKey(slot)}
                    onClick={() => onSelect(slotKey(slot))}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium">{slot.name}</span>
                      <span className="text-muted-foreground text-xs">{t.has(summaryKey(slot.summary)) ? t(summaryKey(slot.summary)) : slot.summary}</span>
                    </span>
                    {slot.overridden ? <Badge variant="secondary">{t("list.overridden")}</Badge> : null}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  )
}
