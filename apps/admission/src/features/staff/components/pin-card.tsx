"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import {
  Button,
  Icons,
  Input,
  LoadingButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { QueryError } from "../../shell/components/query-error"
import { usePin, usePinMutations } from "../api"

/** Internal pages of the student app a pin may open; the server accepts only internal paths. */
export const PIN_LINKS = [
  { value: "/", key: "today" },
  { value: "/tasks/", key: "tasks" },
  { value: "/documents/", key: "documents" },
  { value: "/deadlines/", key: "deadlines" },
  { value: "/essays/", key: "essays" },
  { value: "/chooser/", key: "list" },
  { value: "/tests/", key: "tests" },
  { value: "/profile/", key: "profile" },
  { value: "/review/", key: "review" },
] as const

const NO_LINK = "__none__"

/** The action pinned at the top of the student's Today for 14 days: current pin, pin or replace, unpin. */
export function PinCard({ studentId }: { studentId: string }) {
  const t = useT("staff")
  const { date } = useFormatters()
  const errorMessage = useErrorMessage()
  const query = usePin(studentId)
  const { pin, unpin } = usePinMutations(studentId)
  const [title, setTitle] = useState("")
  const [note, setNote] = useState("")
  const [href, setHref] = useState(NO_LINK)
  const items = [
    { value: NO_LINK, label: t("pin.noLink") },
    ...PIN_LINKS.map((link) => ({ value: link.value, label: t(`pin.links.${link.key}`) })),
  ]
  const current = query.data

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await pin.mutateAsync({
        title: title.trim(),
        href: href === NO_LINK ? null : href,
        note: note.trim() || null,
      })
      toast.success(t("pin.done"))
      setTitle("")
      setNote("")
      setHref(NO_LINK)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function remove() {
    try {
      await unpin.mutateAsync()
      toast.success(t("pin.removed"))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <section aria-label={t("pin.title")} className="bg-card rounded-card flex flex-col gap-3 border p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icons.pin aria-hidden className="size-4" />
        {t("pin.title")}
      </h2>
      {query.isPending ? (
        <Skeleton className="h-12 w-full" />
      ) : query.isError ? (
        <QueryError error={query.error} onRetry={() => void query.refetch()} />
      ) : current ? (
        <div className="flex flex-wrap items-start justify-between gap-2" data-testid="current-pin">
          <div className="flex min-w-0 flex-col gap-0.5 text-sm">
            <span className="font-medium break-words">{current.title}</span>
            {current.note ? <span className="text-muted-foreground break-words">{current.note}</span> : null}
            <span className="text-muted-foreground text-xs">
              {t("pin.by", { name: current.pinned_by })} · {t("pin.expires", { date: date(current.expires_at) })}
            </span>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={unpin.isPending} onClick={() => void remove()}>
            {t("pin.unpin")}
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{t("pin.none")}</p>
      )}
      <form onSubmit={submit} className="flex flex-col gap-2">
        <Input
          value={title}
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("pin.titleField")}
          aria-label={t("pin.titleField")}
          className="min-h-11 md:min-h-8"
        />
        <Input
          value={note}
          maxLength={500}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("pin.noteField")}
          aria-label={t("pin.noteField")}
          className="min-h-11 md:min-h-8"
        />
        <Select items={items} value={href} onValueChange={(value) => setHref(value ?? NO_LINK)}>
          <SelectTrigger aria-label={t("pin.linkField")} className="min-h-11 w-full md:min-h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <LoadingButton type="submit" loading={pin.isPending} disabled={!title.trim()} className="self-start">
          {current ? t("pin.replace") : t("pin.submit")}
        </LoadingButton>
      </form>
    </section>
  )
}
