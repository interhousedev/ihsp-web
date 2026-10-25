"use client"

import { useT } from "@ihsp/i18n"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Icons } from "./icons"
import { Button } from "./ui/button"

/** Copies `value` to the clipboard and confirms with a check mark and a toast. */
export function CopyButton({
  value,
  label,
  variant = "outline",
  size = "default",
}: {
  value: string
  /** Visible text; without it the button is an icon button labelled "Copy". */
  label?: string
  variant?: "outline" | "ghost" | "secondary" | "default"
  size?: "default" | "sm" | "icon"
}) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(t("common.copied"))
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t("errors.generic"))
    }
  }

  const Icon = copied ? Icons.check : Icons.copy
  return (
    <Button
      type="button"
      variant={variant}
      size={label ? size : "icon"}
      className={label ? undefined : "size-11 md:size-8"}
      onClick={copy}
      aria-label={label ? undefined : t("common.copy")}
    >
      <Icon aria-hidden />
      {label}
    </Button>
  )
}
