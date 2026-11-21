"use client"

import { useT } from "@ihsp/i18n"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react"
import { useDebounce } from "../hooks/use-debounce"
import { Icons } from "./icons"
import { NavIconView } from "./layout/nav-icon"
import { useShellSlot } from "./layout/shell-slot"
import type { NavGroup, NavIcon } from "./layout/nav-types"
import { IconButton } from "./ui/icon-button"
import { useSidebar } from "./ui/sidebar"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"

export type CommandPaletteResult = {
  id: string
  title: string
  subtitle?: string
  /** Group heading in the results ("Lessons", "Subjects"). */
  section: string
  url: string
  icon?: NavIcon
}

export type CommandPaletteProps = {
  /** The app navigation; always searchable offline. */
  nav?: NavGroup[]
  /** Server search (`getMeSearch`), called after a short pause with at least 2 characters. */
  search?: (query: string) => Promise<CommandPaletteResult[]>
  /** Defaults to `router.push` (`window.location.assign` for an absolute `https://` URL of another app). */
  onNavigate?: (url: string) => void
  /**
   * Trigger button. By default the shell's: a search icon button in the phone bar, a labelled search button in the
   * sidebar. A function receives the handler that opens the palette.
   */
  trigger?: ReactNode | ((open: (event: MouseEvent<HTMLElement>) => void) => ReactNode)
}

const MIN_QUERY = 2

/** Groups results by `section`, keeping the order of first appearance. */
export function groupResults(results: CommandPaletteResult[]): { section: string; items: CommandPaletteResult[] }[] {
  const groups = new Map<string, CommandPaletteResult[]>()
  for (const result of results) groups.set(result.section, [...(groups.get(result.section) ?? []), result])
  return [...groups].map(([section, items]) => ({ section, items }))
}

/** The sidebar's search button: icon and label in the open panel, the icon alone in the rail. */
function SidebarSearchTrigger({ onOpen }: { onOpen: (event: MouseEvent<HTMLElement>) => void }) {
  const t = useT()
  const { state } = useSidebar()
  if (state === "collapsed") {
    return (
      <IconButton
        icon={Icons.search}
        variant="ghost"
        onClick={onOpen}
        aria-label={t("command.open")}
        data-slot="search-trigger"
      />
    )
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("command.open")}
      data-slot="search-trigger"
      className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 text-sm outline-none focus-visible:ring-2"
    >
      <Icons.search aria-hidden className="size-4 shrink-0" />
      <span className="truncate">{t("command.search")}</span>
    </button>
  )
}

/** The shell's search button: the sidebar's labelled button on desktop, the icon in the phone bar. */
function DefaultTrigger({ onOpen }: { onOpen: (event: MouseEvent<HTMLElement>) => void }) {
  const t = useT()
  const slot = useShellSlot()
  if (slot === "sidebar") return <SidebarSearchTrigger onOpen={onOpen} />
  return <IconButton icon={Icons.search} variant="ghost" onClick={onOpen} aria-label={t("command.open")} />
}

/**
 * Search and quick navigation (Ctrl/Cmd+K). Shows navigation entries that match, plus server results grouped by
 * section when `search` is given.
 */
export function CommandPalette({ nav = [], search, onNavigate, trigger }: CommandPaletteProps) {
  const t = useT()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [remote, setRemote] = useState<CommandPaletteResult[]>([])
  const [searching, setSearching] = useState(false)
  const debounced = useDebounce(query.trim(), 250)
  const searchRef = useRef(search)
  useEffect(() => {
    searchRef.current = search
  }, [search])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        const active = document.activeElement
        if (active instanceof HTMLElement && active !== warmupRef.current && active !== inputRef.current) {
          returnFocusRef.current = active
        }
        setOpen((value) => !value)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
  const warmupRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const [viewport, setViewport] = useState<CSSProperties>()

  useEffect(() => {
    const run = searchRef.current
    if (!open || !run || debounced.length < MIN_QUERY) {
      setRemote([])
      setSearching(false)
      return
    }
    let cancelled = false
    setSearching(true)
    run(debounced)
      .then((results) => {
        if (!cancelled) setRemote(results)
      })
      .catch(() => {
        if (!cancelled) setRemote([])
      })
      .finally(() => {
        if (!cancelled) setSearching(false)
      })
    return () => {
      cancelled = true
    }
  }, [debounced, open])

  // Phone keyboard: size the sheet to the visual viewport so the results stay above the keyboard.
  useEffect(() => {
    const vv = typeof window === "undefined" ? undefined : window.visualViewport
    if (!open || !vv) return
    const update = () =>
      setViewport({
        "--sheet-height": `${Math.round(vv.height)}px`,
        "--sheet-top": `${Math.round(vv.offsetTop)}px`,
      } as CSSProperties)
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
    }
  }, [open])

  function openSearch(event: MouseEvent<HTMLElement>) {
    returnFocusRef.current = event.currentTarget
    warmupRef.current?.focus({ preventScroll: true })
    setOpen(true)
  }

  const navItems = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return nav
      .flatMap((group) => group.items.filter((item) => item.visible !== false && !item.external))
      .filter((item) => needle === "" || item.title.toLowerCase().includes(needle))
  }, [nav, query])
  const grouped = useMemo(() => groupResults(remote), [remote])

  function go(url: string) {
    setOpen(false)
    setQuery("")
    if (onNavigate) onNavigate(url)
    else if (/^https?:\/\//.test(url)) window.location.assign(url)
    else router.push(url)
  }

  return (
    <>
      {/* iOS opens the keyboard only for focus set inside the tap. The dialog mounts a frame later, so this always-
          mounted field takes focus in the tap and the real input (below) takes it over once it exists. */}
      <input
        ref={warmupRef}
        aria-hidden
        tabIndex={-1}
        readOnly
        enterKeyHint="search"
        className="pointer-events-none fixed start-0 top-0 size-px opacity-0"
      />
      {typeof trigger === "function" ? (
        trigger(openSearch)
      ) : (
        (trigger ?? <DefaultTrigger onOpen={openSearch} />)
      )}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        mobileSheet
        contentStyle={viewport}
        initialFocus={inputRef}
        finalFocus={() => returnFocusRef.current ?? true}
        title={t("command.open")}
        description={t("command.placeholder")}
      >
        <Command shouldFilter={false} loop className="h-full">
          <CommandInput
            ref={inputRef}
            value={query}
            onValueChange={setQuery}
            placeholder={t("command.placeholder")}
            enterKeyHint="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            endAddon={
              query ? (
                <button
                  type="button"
                  aria-label={t("common.clear")}
                  // keep the keyboard up: do not let the button take focus from the input
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setQuery("")
                    inputRef.current?.focus()
                  }}
                  className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md"
                >
                  <Icons.close className="size-4" />
                </button>
              ) : null
            }
          />
          <CommandList className="max-sm:max-h-none max-sm:flex-1">
            <CommandEmpty>{searching ? t("command.searching") : t("command.empty")}</CommandEmpty>
            {grouped.map((group) => (
              <CommandGroup key={group.section} heading={group.section}>
                {group.items.map((result) => (
                  <CommandItem key={result.id} value={`${result.section} ${result.id}`} onSelect={() => go(result.url)}>
                    <NavIconView icon={result.icon} />
                    <a href={result.url} tabIndex={-1} className="truncate" onClick={(event) => event.preventDefault()}>
                      {result.title}
                    </a>
                    {result.subtitle ? (
                      <span className="text-muted-foreground ms-auto truncate text-xs">{result.subtitle}</span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {navItems.length > 0 ? (
              <CommandGroup heading={t("command.navigation")}>
                {navItems.map((item) => (
                  <CommandItem key={item.url} value={`nav ${item.title}`} onSelect={() => go(item.url)}>
                    <NavIconView icon={item.icon} />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
