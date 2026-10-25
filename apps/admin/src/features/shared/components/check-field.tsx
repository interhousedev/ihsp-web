import type { ReactNode } from "react"

/** A native checkbox with its label (the whole row is the touch target). */
export function CheckField({
  checked,
  onChange,
  label,
  disabled,
  className,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  disabled?: boolean
  className?: string
}) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center gap-2 text-sm md:min-h-8 ${disabled ? "opacity-50" : ""} ${className ?? ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-primary size-4 shrink-0"
      />
      <span>{label}</span>
    </label>
  )
}
