"use client"

import { useT } from "@ihsp/i18n"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useDebounce } from "../hooks/use-debounce"
import { Icons } from "./icons"
import { NavIconView } from "./layout/nav-icon"
import type { NavGroup, NavIcon } from "./layout/nav-types"
import { IconButton } from "./ui/icon-button"
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
  /** Trigger button; a search icon button by default. */
  trigger?: ReactNode
}

const MIN_QUERY = 2

/** Groups results by `section`, keeping the order of first appearance. */
export function groupResults(results: CommandPaletteResult[]): { section: string; items: CommandPaletteResult[] }[] {
  const groups = new Map<string, CommandPaletteResult[]>()
  for (const result of results) groups.set(result.section, [...(groups.get(result.section) ?? []), result])
  return [...groups].map(([section, items]) => ({ section, items }))
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
        setOpen((value) => !value)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

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
      {trigger ?? (
        <IconButton icon={Icons.search} variant="ghost" onClick={() => setOpen(true)} aria-label={t("command.open")} />
      )}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("command.open")}
        description={t("command.placeholder")}
      >
        <Command shouldFilter={false} loop>
          <CommandInput value={query} onValueChange={setQuery} placeholder={t("command.placeholder")} />
          <CommandList>
            <CommandEmpty>{searching ? t("command.searching") : t("command.empty")}</CommandEmpty>
            {grouped.map((group) => (
              <CommandGroup key={group.section} heading={group.section}>
                {group.items.map((result) => (
                  <CommandItem key={result.id} value={`${result.section} ${result.id}`} onSelect={() => go(result.url)}>
                    <NavIconView icon={result.icon} />
                    <a
                      href={result.url}
                      tabIndex={-1}
                      className="truncate"
                      onClick={(event) => event.preventDefault()}
                    >
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
