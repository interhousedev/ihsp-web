"use client"

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@ihsp/ui"

type CodeInputProps = {
  value: string
  onChange: (value: string) => void
  label: string
  disabled?: boolean
}

/** Controlled 6-digit one-time code input (3 + 3 slots) for places that do not use a TanStack form. */
export function CodeInput({ value, onChange, label, disabled }: CodeInputProps) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <InputOTP
        maxLength={6}
        value={value}
        onChange={onChange}
        aria-label={label}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="one-time-code"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}
