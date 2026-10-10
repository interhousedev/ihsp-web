"use client"

import { useT } from "@ihsp/i18n"
import { IconClock, IconDoor, IconMail, IconPhone, IconSend } from "@ihsp/ui"
import type { ComponentType } from "react"
import { toast } from "sonner"
import { contactChips, type ContactChip } from "../utils/teacher-display"

const ICONS: Record<ContactChip["kind"], ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  telegram: IconSend,
  phone: IconPhone,
  email: IconMail,
  office: IconDoor,
  hours: IconClock,
}

const CHIP =
  "bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full px-3 text-sm md:min-h-8"

function Chip({ chip }: { chip: ContactChip }) {
  const t = useT("teachers.contacts")
  const common = useT("common")
  const Icon = ICONS[chip.kind]
  const label = chip.kind === "office" ? t("office", { office: chip.value }) : chip.value
  const content = (
    <>
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </>
  )
  if (chip.href) {
    return (
      <a
        href={chip.href}
        className={CHIP}
        {...(chip.kind === "telegram" ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {content}
      </a>
    )
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(chip.value)
      toast.success(common("copied"))
    } catch {
      toast.error(t("copyFailed"))
    }
  }
  return (
    <button type="button" className={CHIP} aria-label={`${t("copy")}: ${label}`} onClick={() => void copy()}>
      {content}
    </button>
  )
}

/** Tap a Telegram, phone or email chip to open it; tap the office or hours to copy. */
export function ContactChips({ contacts }: { contacts: Parameters<typeof contactChips>[0] }) {
  const tc = useT("teachers.contacts")
  const chips = contactChips(contacts)
  if (chips.length === 0) return <p className="text-muted-foreground text-sm">{tc("none")}</p>
  return (
    <ul className="flex flex-wrap gap-2" aria-label={tc("title")}>
      {chips.map((chip) => (
        <li key={chip.kind} className="min-w-0 max-w-full">
          <Chip chip={chip} />
        </li>
      ))}
    </ul>
  )
}
