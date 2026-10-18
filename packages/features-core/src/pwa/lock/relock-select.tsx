"use client"

import { useT } from "@ihsp/i18n"
import { Dropdown, Label } from "@ihsp/ui"
import { useId } from "react"
import { RELOCK_OPTIONS, isRelockOption, type RelockOption } from "./lock-policy"

/** "Ask for the PIN again": how long the app may be in the background before it locks. */
export function RelockSelect({ value, onChange }: { value: RelockOption; onChange: (value: RelockOption) => void }) {
  const t = useT("pwa")
  const id = useId()
  return (
    <div className="mt-4 flex max-w-sm flex-col gap-1.5">
      <Label htmlFor={id}>{t("lock.settings.relock.title")}</Label>
      <Dropdown
        id={id}
        className="w-full"
        value={value}
        onValueChange={(next) => {
          if (isRelockOption(next)) onChange(next)
        }}
        options={RELOCK_OPTIONS.map((option) => ({
          value: option,
          label: t(`lock.settings.relock.options.${option}`),
        }))}
      />
      <p className="text-muted-foreground text-xs">{t("lock.settings.relock.hint")}</p>
    </div>
  )
}
