"use client"

import type { ChatItem, NotebookItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Command, CommandDialog, CommandGroup, CommandInput, CommandItem, CommandList, useDebounce } from "@ihsp/ui"
import { IconMessage } from "@ihsp/ui"
import { useMemo, useState } from "react"
import { useNotebooks } from "../notebooks/api"
import { useChats, useSearchChats } from "./use-assistant-queries"
import { useAssistantScope } from "./assistant-context"

const SEARCH_DELAY_MS = 250
const IDLE_CHATS = 8
const IDLE_NOTEBOOKS = 5

type ChatSearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenChat: (chat: ChatItem) => void
  onOpenNotebook: (notebook: NotebookItem) => void
}

function includes(text: string, needle: string): boolean {
  return text.toLocaleLowerCase().includes(needle)
}

/**
 * Command palette over the student's chats and notebooks. Titles are filtered on the client at once; once something
 * is typed the server is asked as well (`GET /ai/chats?q=`, after 250 ms) and its extra hits are added.
 */
export function ChatSearchDialog({ open, onOpenChange, onOpenChat, onOpenNotebook }: ChatSearchDialogProps) {
  const t = useT("assistant")
  const [query, setQuery] = useState("")
  const needle = query.trim().toLocaleLowerCase()
  const debounced = useDebounce(query.trim(), SEARCH_DELAY_MS)
  const { assistant, features } = useAssistantScope()
  const chats = useChats(assistant)
  const notebooks = useNotebooks(undefined, features.notebooks)
  const remote = useSearchChats(assistant, open ? debounced : "")

  const chatHits = useMemo(() => {
    const all = chats.data?.items ?? []
    if (needle === "") return all.slice(0, IDLE_CHATS)
    const local = all.filter((chat) => includes(chat.title, needle))
    const known = new Set(local.map((chat) => chat.id))
    // The server answer belongs to the term it was asked for; ignore it while the field has moved on.
    const extra = debounced.toLocaleLowerCase() === needle ? (remote.data?.items ?? []) : []
    return [...local, ...extra.filter((chat) => !known.has(chat.id))]
  }, [chats.data, remote.data, needle, debounced])

  const notebookHits = useMemo(() => {
    const all = notebooks.data?.items ?? []
    return needle === "" ? all.slice(0, IDLE_NOTEBOOKS) : all.filter((notebook) => includes(notebook.title, needle))
  }, [notebooks.data, needle])

  function close() {
    onOpenChange(false)
    setQuery("")
  }

  const loading = chats.isPending || (features.notebooks && notebooks.isPending)
  const settled = needle === "" || (debounced.toLocaleLowerCase() === needle && !remote.isFetching)
  const nothing = !loading && settled && chatHits.length === 0 && notebookHits.length === 0

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery("")
        onOpenChange(next)
      }}
      title={t("sidebar.search")}
      description={t("search.placeholder")}
      className="sm:max-w-lg"
    >
      <Command shouldFilter={false}>
        <CommandInput placeholder={t("search.placeholder")} value={query} onValueChange={setQuery} />
        <CommandList>
          {nothing ? (
            <p role="status" className="text-muted-foreground py-6 text-center text-sm">
              {t("search.none")}
            </p>
          ) : null}
          {chatHits.length > 0 ? (
            <CommandGroup heading={t("list.title")}>
              {chatHits.map((chat) => (
                <CommandItem
                  key={chat.id}
                  value={`chat-${chat.id}`}
                  className="min-h-11 md:min-h-8"
                  onSelect={() => {
                    close()
                    onOpenChat(chat)
                  }}
                >
                  <IconMessage aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{chat.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {notebookHits.length > 0 ? (
            <CommandGroup heading={t("sidebar.notebooks")}>
              {notebookHits.map((notebook) => (
                <CommandItem
                  key={notebook.id}
                  value={`notebook-${notebook.id}`}
                  className="min-h-11 md:min-h-8"
                  onSelect={() => {
                    close()
                    onOpenNotebook(notebook)
                  }}
                >
                  <span aria-hidden>{notebook.emoji ?? "📓"}</span>
                  <span className="min-w-0 flex-1 truncate">{notebook.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
