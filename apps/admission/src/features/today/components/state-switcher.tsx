"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { TODAY_STATES, type TodayStateId } from "../today-mock"

/** Switches the demo state (`?state=`). Dev-only chrome of the mock; it disappears when the real feed is wired. */
export function StateSwitcher({ value, onChange }: { value: TodayStateId; onChange: (id: TodayStateId) => void }) {
  const t = useT("today")
  return (
    <div className="flex w-full min-w-0 items-center sm:w-auto">
      <div role="group" aria-label={t("switchLabel")} className="bg-muted flex min-w-0 flex-1 rounded-full p-0.5 sm:flex-none">
        {TODAY_STATES.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={value === id}
            onClick={() => onChange(id)}
            className={cn(
              "focus-visible:ring-ring min-h-7 flex-1 rounded-full px-1.5 text-xs sm:px-2.5 font-medium whitespace-nowrap outline-none focus-visible:ring-2 sm:flex-none",
              value === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`states.${id}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
