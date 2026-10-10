"use client"

import { useT } from "@ihsp/i18n"
import { IconBackspace } from "@ihsp/ui"

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const
const KEY =
  "bg-muted hover:bg-muted/70 focus-visible:ring-ring/50 flex size-16 items-center justify-center rounded-full text-2xl font-medium outline-none select-none focus-visible:ring-3 active:scale-95 disabled:opacity-50"

/** A phone-style number pad: big round keys, a zero, and a delete key. */
export function PinKeypad({
  disabled,
  onDigit,
  onDelete,
}: {
  disabled: boolean
  onDigit: (digit: string) => void
  onDelete: () => void
}) {
  const t = useT("pwa")
  return (
    <div className="grid grid-cols-3 gap-x-6 gap-y-3">
      {DIGITS.map((digit) => (
        <button key={digit} type="button" className={KEY} disabled={disabled} onClick={() => onDigit(digit)}>
          {digit}
        </button>
      ))}
      <span aria-hidden />
      <button type="button" className={KEY} disabled={disabled} onClick={() => onDigit("0")}>
        0
      </button>
      <button type="button" className={KEY} disabled={disabled} aria-label={t("lock.delete")} onClick={onDelete}>
        <IconBackspace aria-hidden className="size-6" />
      </button>
    </div>
  )
}
