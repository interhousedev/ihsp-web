"use client"

import { getShareRecipients, type SharePerson, type ShareRecipient } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, IconCopy, IconTrash, Input, useDebounce } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

const MIN_QUERY = 3
const SEARCH_DELAY_MS = 300

export type ShareActions = {
  createLink: () => Promise<{ token: string }>
  deleteLink: () => Promise<unknown>
  addPerson: (userId: string) => Promise<unknown>
  removePerson: (userId: string) => Promise<unknown>
}

type SharePanelProps = {
  linkActive: boolean
  people: readonly SharePerson[]
  /** Builds the address to copy; the token goes in the fragment, which is never sent to a server. */
  linkFor: (token: string) => string
  actions: ShareActions
  errorMessage: (error: unknown) => string
}

function Recipients({ onPick }: { onPick: (person: ShareRecipient) => void }) {
  const t = useT("notebooks.share")
  const [text, setText] = useState("")
  const term = useDebounce(text.trim(), SEARCH_DELAY_MS)
  const found = useQuery({
    queryKey: ["share-recipients", term],
    queryFn: ({ signal }) => getShareRecipients(term, { signal }),
    enabled: term.length >= MIN_QUERY,
  })
  return (
    <div className="flex flex-col gap-2">
      <Input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
      />
      <p className="text-muted-foreground text-xs">{t("recipientsHint")}</p>
      {term.length >= MIN_QUERY && found.data?.items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("noPeople")}</p>
      ) : null}
      <ul className="flex flex-col gap-1">
        {found.data?.items.map((person) => (
          <li key={person.id}>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full justify-start md:min-h-8"
              onClick={() => {
                onPick(person)
                setText("")
              }}
            >
              {person.name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The link and the people of a notebook or a file; every change applies at once. */
export function SharePanel({ linkActive, people, linkFor, actions, errorMessage }: SharePanelProps) {
  const t = useT("notebooks.share")
  const [created, setCreated] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    try {
      await action()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t("linkCopied"))
    } catch {
      toast.error(t("copyFailed"))
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("linkTitle")}</h3>
        {created !== null ? (
          <div className="flex items-center gap-2">
            <Input readOnly value={created} aria-label={t("linkTitle")} className="min-w-0 flex-1" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 md:size-9"
              aria-label={t("copyLink")}
              onClick={() => void copy(created)}
            >
              <IconCopy aria-hidden />
            </Button>
          </div>
        ) : null}
        {created !== null ? <p className="text-muted-foreground text-sm">{t("linkOnce")}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-8"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const { token } = await actions.createLink()
                setCreated(linkFor(token))
              })
            }
          >
            {linkActive ? t("linkReplace") : t("linkCreate")}
          </Button>
          {linkActive ? (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 md:min-h-8"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await actions.deleteLink()
                  setCreated(null)
                })
              }
            >
              {t("linkOff")}
            </Button>
          ) : null}
        </div>
        {linkActive ? <p className="text-muted-foreground text-sm">{t("linkOffHint")}</p> : null}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("peopleTitle")}</h3>
        <Recipients onPick={(person) => void run(() => actions.addPerson(person.id))} />
        <ul className="flex flex-col gap-1">
          {people.map((person) => (
            <li key={person.user_id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm">{person.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 md:size-8"
                aria-label={t("remove", { name: person.name })}
                disabled={busy}
                onClick={() => void run(() => actions.removePerson(person.user_id))}
              >
                <IconTrash aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
