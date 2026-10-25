"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@ihsp/ui"
import { IconChevronDown } from "@ihsp/ui"
import type { SmartState } from "./limit-info"
import type { ChatTier } from "./use-assistant-queries"

const TIERS: ChatTier[] = ["fast", "smart"]

type TierPickerProps = {
  value: ChatTier
  onChange: (tier: ChatTier) => void
  disabled?: boolean
  /** The smart requests left this week; null when the user has no weekly limit (the line is hidden). */
  smart?: SmartState
}

/**
 * `Fast ⌄` / `Smart`: the model class of a new chat (`POST /ai/chats` `tier`). The smart line shows the requests left
 * this week; at zero the smart option is disabled until the week resets.
 */
export function TierPicker({ value, onChange, disabled = false, smart = null }: TierPickerProps) {
  const t = useT("assistant.composer.tier")
  const format = useFormatters()
  const label = t(value)
  const smartExhausted = smart !== null && smart.remaining <= 0
  const smartLine = (): string => {
    if (smart === null) return t("smart")
    if (smartExhausted) {
      const date = smart.resetsAt ? format.date(smart.resetsAt, { day: "numeric", month: "short" }) : ""
      return t("smartNoneLeft", { date })
    }
    return t("smartLeft", { left: smart.remaining, limit: smart.limit })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground min-h-11 max-w-44 shrink-0 gap-1 rounded-full px-3 md:min-h-9"
            aria-label={`${t("label")}: ${label}`}
          />
        }
      >
        {label}
        <IconChevronDown className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-40">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next === "smart" ? "smart" : "fast")}>
          {TIERS.map((tier) => (
            <DropdownMenuRadioItem
              key={tier}
              value={tier}
              disabled={tier === "smart" && smartExhausted}
              className="min-h-11 md:min-h-8"
            >
              {tier === "smart" ? smartLine() : t(tier)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
