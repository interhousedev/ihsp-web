"use client"

import { useId, type ComponentProps, type ReactNode } from "react"
import { cn } from "../lib/utils"
import { Icons } from "./icons"

/**
 * A selectable card backed by a native radio or checkbox input (keyboard, forms and screen readers work as they do
 * for the plain control). Use it inside `ChoiceCardGroup` for one answer (`type="radio"`, the same `name`) or several
 * (`type="checkbox"`).
 */
export function ChoiceCard({
  type = "radio",
  title,
  description,
  icon,
  className,
  id,
  ...props
}: Omit<ComponentProps<"input">, "title" | "type"> & {
  type?: "radio" | "checkbox"
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
}) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <label
      htmlFor={inputId}
      className={cn(
        "border-hairline-strong bg-card relative flex min-h-11 cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors",
        "hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5",
        "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        "motion-reduce:transition-none",
        className,
      )}
    >
      <input id={inputId} type={type} className="peer sr-only" {...props} />
      {icon ? <span className="text-muted-foreground mt-0.5 shrink-0 [&>svg]:size-5">{icon}</span> : null}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        {description ? <span className="text-muted-foreground text-xs">{description}</span> : null}
      </span>
      <span
        aria-hidden
        className={cn(
          "border-hairline-strong mt-0.5 flex size-5 shrink-0 items-center justify-center border text-transparent",
          type === "radio" ? "rounded-full" : "rounded-md",
          "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
        )}
      >
        <Icons.check className="size-3.5" />
      </span>
    </label>
  )
}

/** The fieldset around a set of choice cards; `legend` is the question. */
export function ChoiceCardGroup({
  legend,
  children,
  columns = 1,
  className,
}: {
  legend: ReactNode
  children: ReactNode
  columns?: 1 | 2 | 3
  className?: string
}) {
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-2", className)}>
      <legend className="mb-1 text-sm font-medium">{legend}</legend>
      <div
        className={cn(
          "grid gap-2",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {children}
      </div>
    </fieldset>
  )
}
