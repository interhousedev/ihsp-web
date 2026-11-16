"use client"

import { Icons, Pill, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import type { ComponentProps } from "react"

export type UnderlineTab = {
  value: string
  /** Already translated. */
  label: string
  /** A count pill after the label; omitted when undefined. */
  count?: number
  tone?: ComponentProps<typeof Pill>["tone"]
  icon?: keyof typeof Icons
}

/** A scrollable underline tab strip with optional icon and count pill per tab; the caller renders the panel for `value`. */
export function UnderlineTabs({
  label,
  tabs,
  value,
  onValueChange,
}: {
  label: string
  tabs: readonly UnderlineTab[]
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(String(next))}>
      <TabsList
        variant="line"
        aria-label={label}
        className="border-hairline h-auto! w-full min-w-0 justify-start gap-1 overflow-x-auto border-b p-0"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon ? Icons[tab.icon] : null
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="min-h-11 flex-none px-3 md:min-h-9 after:bottom-0!"
            >
              {Icon ? <Icon aria-hidden className="size-4" /> : null}
              {tab.label}
              {tab.count === undefined ? null : (
                <Pill tone={tab.tone} className="h-5 px-2 text-xs">
                  {tab.count}
                </Pill>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
