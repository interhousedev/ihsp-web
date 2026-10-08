"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconCheck, IconCopy } from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

/** Copies a link and confirms it; 44 px high for touch screens. */
export function CopyLinkButton({ value, label }: { value: string; label: string }) {
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

  return (
    <Button type="button" variant="outline" className="min-h-11" onClick={() => void copy()}>
      {copied ? <IconCheck aria-hidden /> : <IconCopy aria-hidden />}
      {label}
    </Button>
  )
}
