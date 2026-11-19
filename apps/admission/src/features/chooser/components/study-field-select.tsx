"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, Input, ResponsiveDialog, cn } from "@ihsp/ui"
import { cloneElement, useMemo, useState, type MouseEventHandler, type ReactElement, type ReactNode } from "react"
import { FIELD_SLUGS, normalizeStudyGroups } from "../study-label"
import type { StudyGroup } from "../types"

/** Keeps the entries whose label contains the text; groups left empty are dropped. */
export function filterStudyGroups(groups: StudyGroup[], text: string): StudyGroup[] {
  const needle = text.trim().toLowerCase()
  if (!needle) return groups
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLowerCase().includes(needle)) }))
    .filter((group) => group.items.length > 0)
}

/** Label of the chosen field id, if the taxonomy has it. */
export function studyFieldLabel(groups: StudyGroup[], id: string): string | null {
  for (const group of groups) {
    const item = group.items.find((entry) => entry.id === id)
    if (item) return item.label
  }
  return null
}

/** The grouped entries of the sheets; `isChosen` marks the entries already picked. */
function StudyFieldList({
  groups,
  isChosen,
  onPick,
  head,
}: {
  groups: StudyGroup[]
  isChosen: (id: string) => boolean
  onPick: (id: string) => void
  head?: ReactNode
}) {
  const t = useT("chooser")
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      {head}
      {groups.length === 0 ? <p className="text-muted-foreground text-sm">{t("filters.fieldNone")}</p> : null}
      {groups.map((group) => (
        <section key={group.id} aria-label={group.label || undefined} className="flex flex-col gap-1">
          {group.label ? (
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{group.label}</h3>
          ) : null}
          <ul className="flex flex-col">
            {group.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={isChosen(item.id)}
                  onClick={() => onPick(item.id)}
                  className={cn(
                    "hover:bg-muted flex min-h-11 w-full items-center justify-between rounded-md px-2 text-left text-sm md:min-h-9",
                    isChosen(item.id) && "bg-primary/10 text-primary font-medium",
                  )}
                >
                  {item.label}
                  {isChosen(item.id) ? <Icons.check className="size-4" aria-hidden /> : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** Normalized (title-cased, deduplicated) groups of the taxonomy in the UI language. */
export function useNormalizedGroups(groups: StudyGroup[]): StudyGroup[] {
  const locale = useLocale()
  const t = useT("chooserPicker")
  return useMemo(() => {
    const names =
      locale === "en" ? {} : Object.fromEntries(FIELD_SLUGS.map((slug) => [slug, t(`fieldNames.${slug}`)] as const))
    return normalizeStudyGroups(groups, locale, names)
  }, [groups, locale, t])
}

/** The search box and the list of the dialog; the dialog is a desktop dialog and a bottom sheet on a phone. */
function StudyFieldDialog({
  open,
  onOpenChange,
  groups,
  isChosen,
  onPick,
  head,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: StudyGroup[]
  isChosen: (id: string) => boolean
  onPick: (id: string) => void
  head?: ReactNode
}) {
  const t = useT("chooser")
  const [text, setText] = useState("")
  const visible = useMemo(() => filterStudyGroups(groups, text), [groups, text])
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setText("")
        onOpenChange(next)
      }}
      title={t("filters.field")}
      size="md"
      bodyClassName="flex max-h-[60dvh] flex-col gap-3"
    >
      <Input
        type="search"
        autoFocus
        aria-label={t("filters.fieldSearch")}
        placeholder={t("filters.fieldSearch")}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <StudyFieldList groups={visible} isChosen={isChosen} onPick={onPick} head={head} />
    </ResponsiveDialog>
  )
}

/**
 * A picker for the ~1500 fields of study: grouped by family, searchable, in a dialog on a desktop and a bottom sheet on
 * a phone. The chosen value is the item id, which is what the catalog's `field` filter takes.
 */
export function StudyFieldSelect({
  id,
  value,
  groups,
  placeholder,
  disabled,
  onChange,
}: {
  id: string
  value: string
  groups: StudyGroup[]
  /** Shown while nothing is chosen; the chooser's "Any" by default. */
  placeholder?: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  const t = useT("chooser")
  const [open, setOpen] = useState(false)
  const items = useNormalizedGroups(groups)
  const label = value ? (studyFieldLabel(items, value) ?? value) : (placeholder ?? t("filters.any"))

  function pick(next: string) {
    onChange(next)
    setOpen(false)
  }

  return (
    <>
      <Button
        id={id}
        type="button"
        variant="outline"
        disabled={disabled}
        aria-haspopup="dialog"
        className="h-11 w-full justify-between md:h-9"
        onClick={() => setOpen(true)}
      >
        <span className="truncate">{label}</span>
        <Icons.chevronDown className="size-4 shrink-0" aria-hidden />
      </Button>
      <StudyFieldDialog
        open={open}
        onOpenChange={setOpen}
        groups={items}
        isChosen={(entry) => entry === value}
        onPick={pick}
        head={
          <Button type="button" variant="ghost" className="justify-start" onClick={() => pick("")}>
            {t("filters.any")}
          </Button>
        }
      />
    </>
  )
}

/** The same grouped, searchable picker for choosing several fields; it stays open while the entries are toggled. */
export function StudyFieldSheet({
  open,
  onOpenChange,
  groups,
  chosen,
  onToggle,
  trigger,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: StudyGroup[]
  chosen: readonly string[]
  onToggle: (id: string) => void
  trigger: ReactElement<{ onClick?: MouseEventHandler }>
}) {
  const items = useNormalizedGroups(groups)
  return (
    <>
      {cloneElement(trigger, { onClick: () => onOpenChange(true) })}
      <StudyFieldDialog
        open={open}
        onOpenChange={onOpenChange}
        groups={items}
        isChosen={(id) => chosen.includes(id)}
        onPick={onToggle}
      />
    </>
  )
}
