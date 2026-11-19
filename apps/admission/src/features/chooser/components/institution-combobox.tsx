"use client"

import { useT } from "@ihsp/i18n"
import { cn, Icons, Input, Pill, useDebounce } from "@ihsp/ui"
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react"
import { createPortal } from "react-dom"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { useInstitutionPickerSearch, useInstitutionsByIds, useList } from "../hooks"
import type { Institution } from "../types"
import { useOptionLabel } from "./option-label"

export type InstitutionComboboxProps = {
  value: Institution | null
  onChange: (institution: Institution | null) => void
  /** Shown under a "Featured" header when the query is empty. */
  featuredIds?: string[]
  /** The dashed "Add a school" last row; receives the typed text. */
  onAddSchool?: (query: string) => void
  onSkip?: () => void
  placeholder?: string
  autoFocus?: boolean
  id?: string
}

const LIMIT = 8
const NO_IDS: string[] = []

/** "4%" or "4-6%" from the catalog's `acceptance_rate` fact (a number or a {min, max} range). */
export function acceptanceText(value: unknown): string | null {
  if (typeof value === "number") return `${value}%`
  if (value && typeof value === "object" && "min" in value && "max" in value) {
    const { min, max } = value as { min: unknown; max: unknown }
    if (typeof min === "number" && typeof max === "number") return min === max ? `${min}%` : `${min}-${max}%`
  }
  return null
}

const GAP = 4
const EDGE = 8
const MAX_HEIGHT = 320
const MIN_HEIGHT = 160

type Box = { left: number; width: number; maxHeight: number; top?: number; bottom?: number }

/**
 * Fixed position of a list under (or, with no room below, above) the anchor, fitted to the visual viewport so the
 * on-screen keyboard and a scrolling dialog body never clip it. Follows resize, visual-viewport and scroll changes.
 */
function useAnchoredBox(anchor: RefObject<HTMLElement | null>, open: boolean): Box | null {
  const [box, setBox] = useState<Box | null>(null)
  useLayoutEffect(() => {
    if (!open) {
      setBox(null)
      return
    }
    function update() {
      const el = anchor.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const viewport = window.visualViewport
      const top = viewport?.offsetTop ?? 0
      const height = viewport?.height ?? window.innerHeight
      const below = top + height - rect.bottom - GAP - EDGE
      const above = rect.top - top - GAP - EDGE
      const flip = below < MIN_HEIGHT && above > below
      const room = flip ? above : below
      const base = { left: rect.left, width: rect.width, maxHeight: Math.max(96, Math.min(MAX_HEIGHT, room)) }
      setBox(flip ? { ...base, bottom: window.innerHeight - rect.top + GAP } : { ...base, top: rect.bottom + GAP })
    }
    update()
    const viewport = window.visualViewport
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    viewport?.addEventListener("resize", update)
    viewport?.addEventListener("scroll", update)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
      viewport?.removeEventListener("resize", update)
      viewport?.removeEventListener("scroll", update)
    }
  }, [anchor, open])
  return box
}

type Row = { kind: "institution"; institution: Institution } | { kind: "add" }

function Option({
  id,
  institution,
  active,
  selected,
  onPick,
  onHover,
}: {
  id: string
  institution: Institution
  active: boolean
  selected: boolean
  onPick: () => void
  onHover: () => void
}) {
  const t = useT("chooserPicker")
  const loose = t as unknown as { has: (key: string) => boolean }
  const country = useOptionLabel("country")
  const place = [institution.city, country(institution.country)].filter(Boolean).join(", ")
  const rate = acceptanceText(institution.facts.acceptance_rate?.value)
  const policy = institution.facts.test_policy?.value
  const policyKey = typeof policy === "string" && loose.has(`policy.${policy}`) ? policy : null
  return (
    <div
      id={id}
      role="option"
      tabIndex={-1}
      aria-selected={selected}
      data-active={active || undefined}
      onMouseDown={(event) => {
        event.preventDefault()
        onPick()
      }}
      onMouseEnter={onHover}
      className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-2", active && "bg-muted")}
    >
      <LogoAvatar
        name={institution.name}
        src={institution.logo_url}
        fit={institution.logo_fit}
        zoom={institution.logo_zoom}
        className="size-8 text-xs ring-0"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{institution.name}</span>
        {place ? <span className="text-muted-foreground truncate text-xs">{place}</span> : null}
      </span>
      <span className="flex shrink-0 flex-wrap justify-end gap-1">
        {rate ? <Pill>{t("acceptance", { rate })}</Pill> : null}
        {policyKey ? <Pill>{t(`policy.${policyKey}`)}</Pill> : null}
      </span>
    </div>
  )
}

/** Search-as-you-type picker of one institution of the catalog (Kolly "school" selector). */
export function InstitutionCombobox({
  value,
  onChange,
  featuredIds = NO_IDS,
  onAddSchool,
  onSkip,
  placeholder,
  autoFocus,
  id,
}: InstitutionComboboxProps) {
  const t = useT("chooserPicker")
  const generated = useId()
  const inputId = id ?? `${generated}-input`
  const listId = `${generated}-list`
  const optionId = (index: number) => `${generated}-option-${index}`
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const anchor = useRef<HTMLDivElement>(null)
  const [text, setText] = useState("")
  const [typing, setTyping] = useState(false)
  const [open, setOpen] = useState(false)
  const box = useAnchoredBox(anchor, open)
  const [active, setActive] = useState(-1)
  const query = text.trim()
  const debounced = useDebounce(query, 250)
  const searching = typing && query !== ""

  const featured = useInstitutionsByIds(open ? featuredIds : NO_IDS)
  const list = useList()
  const listed = (list.data ?? []).map((entry) => entry.institution).slice(0, LIMIT)
  const hasDefault = featuredIds.length > 0 || listed.length > 0
  const found = useInstitutionPickerSearch(searching ? debounced : "", LIMIT, open && (searching || !hasDefault))

  let header: string | null = null
  let institutions: Institution[]
  if (searching) {
    institutions = found.data?.items ?? []
  } else if (featuredIds.length > 0) {
    header = t("featured")
    institutions = featured.institutions
  } else if (listed.length > 0) {
    header = t("yourList")
    institutions = listed
  } else {
    header = t("popular")
    institutions = found.data?.items ?? []
  }
  const pending = searching
    ? debounced !== query || found.isFetching
    : featuredIds.length > 0
      ? featured.isLoading
      : listed.length === 0 && found.isFetching
  const failed = !pending && found.isError && (searching || !hasDefault)
  const rows: Row[] = [
    ...institutions.map((institution) => ({ kind: "institution", institution }) as const),
    ...(onAddSchool && !pending ? [{ kind: "add" } as const] : []),
  ]

  function close() {
    setOpen(false)
    setActive(-1)
    setTyping(false)
    setText("")
  }
  function pick(row: Row | undefined) {
    if (!row) return
    if (row.kind === "add") {
      onAddSchool?.(query)
    } else {
      onChange(row.institution)
    }
    close()
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const step = event.key === "ArrowDown" ? 1 : -1
      setActive((current) => (rows.length === 0 ? -1 : (current + step + rows.length) % rows.length))
    } else if (event.key === "Home" || event.key === "End") {
      if (open && rows.length > 0) {
        event.preventDefault()
        setActive(event.key === "Home" ? 0 : rows.length - 1)
      }
    } else if (event.key === "Enter") {
      if (open && active >= 0) {
        event.preventDefault()
        pick(rows[active])
      }
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault()
        event.stopPropagation()
        close()
      }
    }
  }

  return (
    <div
      ref={root}
      className="relative flex min-w-0 flex-col gap-1.5"
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null
        if (!root.current?.contains(next) && !popup.current?.contains(next)) close()
      }}
    >
      <div ref={anchor} className="relative">
        <Icons.search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          ref={input}
          id={inputId}
          role="combobox"
          aria-label={t("label")}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          className="rounded-lg pr-9 pl-9"
          placeholder={placeholder ?? t("placeholder")}
          value={typing ? text : (value?.name ?? "")}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setText(event.target.value)
            setTyping(true)
            setOpen(true)
            setActive(-1)
          }}
          onKeyDown={onKeyDown}
        />
        {value || text ? (
          <button
            type="button"
            aria-label={t("clear")}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-full"
            onClick={() => {
              onChange(null)
              close()
              input.current?.focus()
            }}
          >
            <Icons.close aria-hidden className="size-4" />
          </button>
        ) : null}
      </div>
      {open
        ? createPortal(
            <div
              ref={popup}
              data-testid="institution-listbox-popup"
              role="presentation"
              style={{ position: "fixed", ...box, visibility: box ? undefined : "hidden" }}
              onMouseDown={(event) => event.preventDefault()}
              className="border-hairline-strong rounded-card bg-popover text-popover-foreground z-[200] flex flex-col gap-1 overflow-y-auto overscroll-contain border p-1.5 shadow-lg"
            >
              {header ? <p className="text-muted-foreground px-2 pt-1 text-xs font-medium">{header}</p> : null}
              <div id={listId} role="listbox" aria-label={t("results")} className="flex flex-col gap-0.5">
                {rows.map((row, index) =>
                  row.kind === "institution" ? (
                    <Option
                      key={row.institution.id}
                      id={optionId(index)}
                      institution={row.institution}
                      active={index === active}
                      selected={value?.id === row.institution.id}
                      onPick={() => pick(row)}
                      onHover={() => setActive(index)}
                    />
                  ) : (
                    <div
                      key="add"
                      id={optionId(index)}
                      role="option"
                      tabIndex={-1}
                      aria-selected={false}
                      data-active={index === active || undefined}
                      onMouseDown={(event) => {
                        event.preventDefault()
                        pick(row)
                      }}
                      onMouseEnter={() => setActive(index)}
                      className={cn(
                        "text-muted-foreground flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed px-2 py-2 text-sm",
                        index === active && "bg-muted",
                      )}
                    >
                      <Icons.add aria-hidden className="size-4" />
                      {query ? t("addNamed", { query }) : t("add")}
                    </div>
                  ),
                )}
              </div>
              {pending ? (
                <p role="status" className="text-muted-foreground px-2 py-2 text-sm">
                  {t("searching")}
                </p>
              ) : null}
              {failed ? (
                <p role="alert" className="text-destructive flex items-center gap-2 px-2 py-2 text-sm">
                  {t("error")}
                  <button
                    type="button"
                    className="underline"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => void found.refetch()}
                  >
                    {t("retry")}
                  </button>
                </p>
              ) : null}
              {!pending && !failed && institutions.length === 0 && searching ? (
                <p className="text-muted-foreground px-2 py-2 text-sm">{t("empty", { query })}</p>
              ) : null}
            </div>,
            document.body,
          )
        : null}
      {onSkip ? (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground w-fit text-sm underline-offset-2 hover:underline"
          onClick={onSkip}
        >
          {t("skip")}
        </button>
      ) : null}
    </div>
  )
}
