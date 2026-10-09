"use client"

import {
  deleteReadingList,
  keys,
  patchReadingList,
  postReadingList,
  putReadingListItems,
  type ItemCard,
  type ReadingListDetail,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons, buttonVariants } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useUniLibraryEnabled } from "../../hooks/use-uni-library"
import { listHref, listsHref } from "../../utils/hrefs"
import {
  MAX_ENTRIES,
  emptySettings,
  entryFromServer,
  entryProblems,
  hasItem,
  itemEntry,
  linkEntry,
  moveVisible,
  removeEntry,
  settingsFromServer,
  settingsProblems,
  toItemInputs,
  toListInput,
  updateEntry,
  type EditorEntry,
  type ListSettings,
} from "./entries"
import { EntryLinkForm } from "./entry-link-form"
import { EntryList } from "./entry-list"
import { EntrySearch } from "./entry-search"
import { ListSettingsFields } from "./list-settings-fields"
import { useGroupChoices } from "./use-group-choices"

/**
 * The editor: settings, the entries (drag or move buttons, importance, pages, week, due date, note), a catalogue
 * search and a link form for adding, and Save. Saving writes the list (`POST` or `PATCH`) and then replaces its entries
 * (`PUT …/items`). A list that exists can also be deleted.
 *
 * Entries the screen hides (UniLibrary records while UniLibrary is off) stay in the state and are saved again, because
 * the save replaces the whole list and must not drop what the user cannot see.
 */
export function ListEditorForm({ list }: { list?: ReadingListDetail }) {
  const t = useT("library.listEditor")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const queryClient = useQueryClient()
  const uniLibrary = useUniLibraryEnabled()
  const groups = useGroupChoices()

  const [settings, setSettings] = useState<ListSettings>(() => (list ? settingsFromServer(list) : emptySettings()))
  const [entries, setEntries] = useState<EditorEntry[]>(() => (list ? list.entries.map(entryFromServer) : []))
  const [showProblems, setShowProblems] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [touched, setTouched] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  // Once the list exists on the server a second Save updates it, even when the first one failed halfway.
  const listId = useRef<string | null>(list?.id ?? null)

  const isVisible = (entry: EditorEntry) => uniLibrary || entry.item?.kind !== "external"
  const shown = entries.filter(isVisible)
  const full = entries.length >= MAX_ENTRIES

  const changeSettings = (patch: Partial<ListSettings>) => {
    setTouched(true)
    setSettings((current) => ({ ...current, ...patch }))
  }
  const changeEntries = (next: EditorEntry[]) => {
    setTouched(true)
    setEntries(next)
  }

  useEffect(() => {
    if (!touched) return
    const listener = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", listener)
    return () => window.removeEventListener("beforeunload", listener)
  }, [touched])

  function addItem(card: ItemCard) {
    if (!card.id || hasItem(entries, card.id) || full) return
    changeEntries([...entries, itemEntry(card)])
    setAnnouncement(t("search.addedAnnounce", { title: card.title, count: entries.length + 1 }))
  }

  function addLink(title: string, url: string) {
    if (full) return
    changeEntries([...entries, linkEntry(title, url)])
    setAnnouncement(t("search.addedAnnounce", { title, count: entries.length + 1 }))
  }

  const save = useMutation({
    mutationFn: async () => {
      const input = toListInput(settings)
      const saved = listId.current ? await patchReadingList(listId.current, input) : await postReadingList(input)
      listId.current = saved.id
      return putReadingListItems(saved.id, { items: toItemInputs(entries) })
    },
    onSuccess: (saved) => {
      setTouched(false)
      toast.success(t("saved"))
      void queryClient.invalidateQueries({ queryKey: keys.library.all() })
      router.push(listHref(saved.id))
    },
  })

  const remove = useMutation({
    mutationFn: () => deleteReadingList(list!.id),
    onSuccess: () => {
      setTouched(false)
      setDeleting(false)
      toast.success(t("deleted"))
      void queryClient.invalidateQueries({ queryKey: keys.library.all() })
      router.push(listsHref())
    },
  })

  const invalid =
    settingsProblems(settings, groups.state === "ready").length > 0 || entries.some((e) => entryProblems(e).length > 0)

  function onSave() {
    setShowProblems(true)
    if (!invalid) save.mutate()
  }

  return (
    <form
      noValidate
      className="mx-auto flex w-full max-w-4xl flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <section aria-labelledby="list-settings-heading" className="flex flex-col gap-4">
        <h2 id="list-settings-heading" className="text-xl font-semibold">
          {t("settings.heading")}
        </h2>
        <ListSettingsFields settings={settings} onChange={changeSettings} showProblems={showProblems} groups={groups} />
      </section>

      <section aria-labelledby="list-entries-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="list-entries-heading" className="text-xl font-semibold">
            {t("entries.heading")}
          </h2>
          <p className="text-muted-foreground text-sm" data-testid="entry-count">
            {t("entries.count", { count: entries.length, max: MAX_ENTRIES })}
          </p>
        </div>
        {shown.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">{t("entries.empty")}</p>
        ) : (
          <EntryList
            entries={shown}
            onChange={(key, patch) => changeEntries(updateEntry(entries, key, patch))}
            onMove={(from, to) => changeEntries(moveVisible(entries, isVisible, from, to))}
            onRemove={(key) => changeEntries(removeEntry(entries, key))}
            showProblems={showProblems}
          />
        )}
        {full ? (
          <p role="status" className="text-sm font-medium">
            {t("entries.limit", { max: MAX_ENTRIES })}
          </p>
        ) : null}
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
        <div className="bg-muted/30 flex flex-col gap-6 rounded-xl border p-4">
          <EntrySearch full={full} isAdded={(card) => card.id !== null && hasItem(entries, card.id)} onAdd={addItem} />
          <EntryLinkForm full={full} onAdd={addLink} />
        </div>
      </section>

      {showProblems && invalid ? (
        <p role="alert" className="text-destructive text-sm">
          {t("fixProblems")}
        </p>
      ) : null}
      {save.isError ? (
        <p role="alert" className="text-destructive text-sm" data-error-type={(save.error as { type?: string }).type}>
          {errorMessage(save.error)}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={list ? listHref(list.id) : listsHref()}
            className={buttonVariants({ variant: "ghost", className: "min-h-11" })}
          >
            {t("cancel")}
          </Link>
          {list ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive min-h-11"
              onClick={() => setDeleting(true)}
            >
              <Icons.trash aria-hidden />
              {t("delete")}
            </Button>
          ) : null}
        </div>
        <Button type="submit" className="min-h-11" disabled={save.isPending}>
          {save.isPending ? t("saving") : t("save")}
        </Button>
      </div>

      <ConfirmDialog
        open={deleting}
        onOpenChange={(open) => {
          setDeleting(open)
          if (!open) remove.reset()
        }}
        title={t("deleteTitle")}
        description={t("deleteText", { title: settings.title })}
        confirmLabel={t("delete")}
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
      >
        {remove.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(remove.error)}
          </p>
        ) : null}
      </ConfirmDialog>
    </form>
  )
}
