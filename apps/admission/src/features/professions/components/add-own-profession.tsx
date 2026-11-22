"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Input } from "@ihsp/ui"
import { useId, useState } from "react"
import { VoiceFill } from "@/components/voice-fill/voice-fill"
import type { Profession } from "../api"
import { CustomProfession } from "./custom-profession"

/**
 * 'Add another profession' at the top of the list: a button that opens a short panel telling the student to be
 * specific (role and place) and a field for the title; the card is then filled and confirmed like any typed-in one.
 */
export function AddOwnProfession({
  full,
  fieldLabel,
  onAdd,
}: {
  full: boolean
  fieldLabel: (key: string) => string
  onAdd: (profession: Profession) => void
}) {
  const t = useT("professions")
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const panel = useId()
  const query = title.trim()
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 self-start"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen((value) => !value)}
      >
        <Icons.plusCircle aria-hidden />
        {t("addOwn.button")}
      </Button>
      {open ? (
        <div id={panel} className="bg-card rounded-card flex flex-col gap-2 border p-3">
          <p className="text-muted-foreground text-sm">{t("addOwn.description")}</p>
          <VoiceFill
            form="own_profession"
            questions={[t("addOwn.description")]}
            fields={[{ key: "title", label: t("addOwn.title"), max_length: 80 }]}
            onFill={(values) => {
              const value = values.title?.trim()
              if (value) setTitle(value.slice(0, 80))
            }}
          >
            <Input
              value={title}
              maxLength={80}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("addOwn.placeholder")}
              aria-label={t("addOwn.title")}
            />
          </VoiceFill>
          {query.length >= 2 ? (
            <CustomProfession
              query={query}
              full={full}
              fieldLabel={fieldLabel}
              hideHint
              onAdd={(profession) => {
                onAdd(profession)
                setTitle("")
                setOpen(false)
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
