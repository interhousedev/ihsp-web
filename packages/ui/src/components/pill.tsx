import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"
import { cn } from "../lib/utils"

const pillVariants = cva(
  "inline-flex h-7 w-fit max-w-full shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-hairline-strong bg-muted text-foreground",
        primary: "border-transparent bg-primary/10 text-primary",
        success: "border-transparent bg-success-muted text-success",
        warning: "border-transparent bg-warning-muted text-warning",
        danger: "border-transparent bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
)

export type PillProps = ComponentProps<"span"> & VariantProps<typeof pillVariants>

/** A rounded label: a status, a tag, a count. */
export function Pill({ className, tone, ...props }: PillProps) {
  return <span data-slot="pill" className={cn(pillVariants({ tone }), className)} {...props} />
}

const DOT_TONE = {
  neutral: "bg-muted-foreground",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
} as const

/** The coloured dot of a status pill; decorative, the text next to it says the same. */
export function PillIndicator({ tone = "neutral", className }: { tone?: keyof typeof DOT_TONE; className?: string }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOT_TONE[tone], className)} />
}

/** A pill with a dot: `<PillStatus tone="success">Submitted</PillStatus>`. */
export function PillStatus({ tone = "neutral", children, className, ...props }: PillProps) {
  return (
    <Pill tone={tone} className={className} {...props}>
      <PillIndicator tone={tone ?? "neutral"} />
      {children}
    </Pill>
  )
}

/** A pill that is a button (a filter, a suggestion); `pressed` marks the selected one. */
export function PillButton({
  className,
  tone,
  pressed,
  type = "button",
  ...props
}: Omit<ComponentProps<"button">, "aria-pressed"> & VariantProps<typeof pillVariants> & { pressed?: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cn(
        pillVariants({ tone: pressed ? "primary" : tone }),
        "min-h-7 cursor-pointer transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
        pressed && "border-primary",
        className,
      )}
      {...props}
    />
  )
}
