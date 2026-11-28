"use client"

import { useT } from "@ihsp/i18n"
import { Icons, Label, Tabs, TabsList, TabsTrigger, Textarea } from "@ihsp/ui"
import type { FormField } from "../api/activities-api"
import { useEffect, useRef, type ReactNode } from "react"
import { hueOf } from "../use-activities"

const initials = (name: string) => {
  const words = name.split(" ").filter(Boolean)
  return (
    words.length > 1
      ? words
          .slice(0, 2)
          .map((w) => w[0])
          .join("")
      : name.slice(0, 2)
  ).toUpperCase()
}

/** A club logo: the uploaded picture, or the initials on a colour taken from the club's name. */
export function ClubLogo({
  club,
  size = "md",
}: {
  club: { name: string; logoUrl?: string | null }
  size?: "sm" | "md" | "lg"
}) {
  const cls = size === "lg" ? "size-20 text-2xl" : size === "sm" ? "size-10 text-sm" : "size-14 text-lg"
  if (club.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={club.logoUrl} alt="" className={`${cls} shrink-0 rounded-2xl object-cover`} />
  }
  return (
    <span
      className={`${cls} flex shrink-0 items-center justify-center rounded-2xl font-bold text-white`}
      style={{ background: `oklch(0.58 0.14 ${hueOf(club.name)})` }}
      aria-hidden
    >
      {initials(club.name)}
    </span>
  )
}

/** Initials on a colour taken from the name (no photo is served for members). */
export function PersonAvatar({ person, size = 40 }: { person: { name: string }; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size / 2.8, background: `oklch(0.62 0.12 ${hueOf(person.name)})` }}
      aria-hidden
    >
      {initials(person.name)}
    </span>
  )
}

export function Stars({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm tabular-nums" aria-label={`${value} / 5`}>
      <Icons.exclusive className="size-4 text-warning" aria-hidden />
      <span className="font-semibold">{value.toFixed(1)}</span>
      {count !== undefined ? <span className="text-muted-foreground">({count})</span> : null}
    </span>
  )
}

export function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string
  hint?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {hint ? <p className="text-muted-foreground text-sm">{hint}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export const SELECT_CLASS =
  "border-input bg-background min-h-11 w-full rounded-lg border px-2 text-sm md:min-h-9 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"

/** Tab strip that keeps the active tab in view on a phone and names the open section above the content. */
export function SectionTabs({
  tabs,
  value,
  onChange,
  children,
}: {
  tabs: { value: string; label: string; count?: number }[]
  value: string
  onChange: (v: string) => void
  children: ReactNode
}) {
  const rail = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      rail.current?.querySelector<HTMLElement>("[data-active]")?.scrollIntoView({ inline: "center", block: "nearest" }),
    )
    return () => cancelAnimationFrame(id)
  }, [value])
  const current = tabs.find((x) => x.value === value)
  return (
    <Tabs value={value} onValueChange={(v) => onChange(String(v))}>
      <div className="relative">
        <div ref={rail} className="max-w-full overflow-x-auto overflow-y-hidden py-1">
          <TabsList className="h-auto min-h-11 w-max min-w-full md:w-fit md:min-w-0">
            {tabs.map((x) => (
              <TabsTrigger key={x.value} value={x.value} className="min-h-11 px-3 whitespace-nowrap">
                {x.label}
                {x.count ? (
                  <span className="bg-background/30 ms-1.5 rounded-full px-1.5 text-xs tabular-nums">{x.count}</span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div
          className="from-background pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-l to-transparent md:hidden"
          aria-hidden
        />
      </div>
      {current ? <h2 className="text-lg font-semibold md:hidden">{current.label}</h2> : null}
      {children}
    </Tabs>
  )
}

/** The inputs of a position's application form (`form_schema.fields`); the answers keep the field keys. */
export function ApplyField({
  field,
  value,
  onChange,
}: {
  field: FormField
  value: unknown
  onChange: (v: unknown) => void
}) {
  const t = useT("activities")
  const label = (field.label ?? field.key) + (field.required ? " *" : "")
  if (field.type === "choice") {
    return (
      <div className="grid gap-1.5">
        <Label>{label}</Label>
        <select
          required={field.required}
          className="border-input bg-background min-h-11 w-full rounded-lg border px-2 text-sm md:min-h-9"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{t("choosePlaceholder")}</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    )
  }
  if (field.type === "bool") {
    return (
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    )
  }
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {field.type === "number" ? (
        <input
          type="number"
          required={field.required}
          placeholder={t("numberPlaceholder")}
          className="border-input bg-background min-h-11 w-full rounded-lg border px-2 text-sm md:min-h-9"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      ) : (
        <Textarea
          rows={2}
          required={field.required}
          placeholder={t("answerPlaceholder")}
          maxLength={field.max_length}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
