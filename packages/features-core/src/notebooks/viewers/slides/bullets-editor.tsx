"use client"

import { Button, Icons, Input } from "@ihsp/ui"
import { removeItemAt, replaceItem } from "./slide-deck-state"

type BulletsEditorProps = {
  legend: string
  bullets: readonly string[]
  itemLabel: (n: number) => string
  removeLabel: (n: number) => string
  addLabel: string
  onChange: (bullets: string[]) => void
}

/** A list of one-line fields with a remove button each and an "add" button. */
export function BulletsEditor({ legend, bullets, itemLabel, removeLabel, addLabel, onChange }: BulletsEditorProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="text-muted-foreground mb-1 text-xs font-medium">{legend}</legend>
      {bullets.map((bullet, index) => (
        <div key={index} className="flex items-center gap-1">
          <Input
            value={bullet}
            aria-label={itemLabel(index + 1)}
            className="h-11 md:h-9"
            onChange={(event) => onChange(replaceItem(bullets, index, event.target.value))}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground size-11 shrink-0 md:size-9"
            aria-label={removeLabel(index + 1)}
            onClick={() => onChange(removeItemAt(bullets, index))}
          >
            <Icons.close aria-hidden />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="min-h-11 self-start md:min-h-8"
        onClick={() => onChange([...bullets, ""])}
      >
        <Icons.add aria-hidden />
        {addLabel}
      </Button>
    </fieldset>
  )
}
