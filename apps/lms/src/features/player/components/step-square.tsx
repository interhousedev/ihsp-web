"use client"

import type { StepView } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons, cn } from "@ihsp/ui"
import Link from "next/link"
import { useEffect, useRef } from "react"

type Block = StepView["blocks"][number]

const ICONS = { text: Icons.post, test: Icons.help, flashcards: Icons.flashcards } as const

/**
 * One square of the step strip: the type icon of a step (block) of the lesson. Passed steps are filled green, the
 * current one is outlined and carries `aria-current="step"`; it scrolls into view when the strip is scrollable.
 */
export function StepSquare({
  block,
  number,
  current,
  href,
}: {
  block: Block
  number: number
  current: boolean
  href: string
}) {
  const t = useT("player")
  const ref = useRef<HTMLAnchorElement>(null)
  const Icon = ICONS[block.type]
  const label = t("stepLabel", {
    number,
    kind: t(`kind.${block.type}`),
    status: t(block.passed ? "status.passed" : "status.notPassed"),
  })

  useEffect(() => {
    if (current) ref.current?.scrollIntoView?.({ block: "nearest", inline: "center" })
  }, [current])

  return (
    <Link
      ref={ref}
      href={href}
      aria-label={label}
      title={label}
      aria-current={current ? "step" : undefined}
      data-passed={block.passed ? "true" : "false"}
      className={cn(
        "flex size-11 items-center justify-center rounded-sm text-(--stepik-chrome-muted) outline-none transition-colors md:size-7",
        "bg-white/15 hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-(--stepik-green)",
        block.passed && "bg-(--stepik-green) text-[#0a2a12] hover:bg-(--stepik-green)/85",
        current && "ring-2 ring-white",
      )}
    >
      <Icon aria-hidden className="size-4" />
    </Link>
  )
}
