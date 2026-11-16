"use client"

import { Button, Icons } from "@ihsp/ui"
import { useRef, type ComponentProps } from "react"

/** A button that opens the file dialog and hands the chosen file over. */
export function FilePickButton({
  label,
  onPick,
  disabled,
  variant = "outline",
  size,
}: {
  label: string
  onPick: (file: File) => void
  disabled?: boolean
  variant?: ComponentProps<typeof Button>["variant"]
  size?: ComponentProps<typeof Button>["size"]
}) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={input}
        type="file"
        hidden
        data-testid="file-input"
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) onPick(file)
        }}
      />
      <Button type="button" variant={variant} size={size} disabled={disabled} onClick={() => input.current?.click()}>
        <Icons.upload data-icon="inline-start" aria-hidden />
        {label}
      </Button>
    </>
  )
}
