"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@ihsp/ui"
import { IconChevronDown } from "@tabler/icons-react"
import type { ChatTier } from "./use-assistant-queries"

const TIERS: ChatTier[] = ["fast", "smart"]

type TierPickerProps = {
  value: ChatTier
  onChange: (tier: ChatTier) => void
  disabled?: boolean
}

/** `Fast ⌄` / `Smart`: the model class of a new chat (`POST /ai/chats` `tier`). */
export function TierPicker({ value, onChange, disabled = false }: TierPickerProps) {
  const t = useT("assistant.composer.tier")
  const label = t(value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground min-h-11 shrink-0 gap-1 rounded-full px-3 md:min-h-9"
            aria-label={`${t("label")}: ${label}`}
          />
        }
      >
        {label}
        <IconChevronDown className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-40">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next === "smart" ? "smart" : "fast")}>
          {TIERS.map((tier) => (
            <DropdownMenuRadioItem key={tier} value={tier} className="min-h-11 md:min-h-8">
              {t(tier)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
