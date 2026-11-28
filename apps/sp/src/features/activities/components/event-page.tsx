"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import {
  Button,
  buttonVariants,
  Card,
  CardContent,
  Icons,
  Input,
  PageContainer,
  ResponsiveDialog,
  Textarea,
} from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import type { ClubEvent } from "../api/activities-api"
import { useClub, useEvent, useEventQr, useMyRsvp, useRsvpMutation } from "../use-activities"
import { useAlbumActions, useEventAlbum, useEventEdit } from "../use-club-media"
import { Section } from "./activity-ui"
import { EventCover } from "./club-media"

/** Organizer form of `PATCH /events/{id}`: title, description, place and capacity (times move through reschedule). */
function EditEventDialog({
  event,
  open,
  onOpenChange,
}: {
  event: ClubEvent
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const m = useT("clubMedia")
  const errorMessage = useErrorMessage()
  const { update } = useEventEdit(event.id)
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description ?? "")
  const [location, setLocation] = useState(event.location ?? "")
  const [capacity, setCapacity] = useState(event.capacity ? String(event.capacity) : "")
  const valid = title.trim() !== "" && (capacity === "" || Number(capacity) >= 1)
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={m("edit.title")}
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid || update.isPending) return
        update.mutate(
          {
            title: title.trim(),
            description: description.trim(),
            location: location.trim() || null,
            capacity: capacity ? Number(capacity) : null,
          },
          { onSuccess: () => onOpenChange(false) },
        )
      }}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {m("cancel")}
          </Button>
          <Button type="submit" disabled={!valid || update.isPending}>
            {m("edit.save")}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 text-sm">
        <label className="grid gap-1">
          {m("edit.name")}
          <Input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="grid gap-1">
          {m("edit.about")}
          <Textarea rows={4} maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="grid gap-1">
          {m("edit.location")}
          <Input value={location} maxLength={300} onChange={(e) => setLocation(e.target.value)} />
        </label>
        <label className="grid gap-1">
          {m("edit.capacity")}
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </label>
        {update.isError ? (
          <p role="alert" className="text-destructive">
            {errorMessage(update.error)}
          </p>
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}

/** Album entry of the event page; organizers create the album, everyone else sees it once it exists. */
function EventAlbumCard({ eventId, canManage }: { eventId: string; canManage: boolean }) {
  const m = useT("clubMedia")
  const errorMessage = useErrorMessage()
  const album = useEventAlbum(eventId)
  const { create } = useAlbumActions(eventId, album.data?.id ?? null)
  const a = album.data
  if (album.isPending || (!a && !canManage)) return null
  return (
    <Section title={m("title")}>
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm">
          {a ? (
            <>
              <span className="text-muted-foreground tabular-nums">{m("count", { count: a.item_count })}</span>
              <Link href={`/activities/album/?event=${eventId}`} className={buttonVariants({ size: "sm" })}>
                <Icons.media data-icon="inline-start" aria-hidden />
                {m("open")}
              </Link>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">{m("noAlbum")}</span>
              <Button type="button" size="sm" disabled={create.isPending} onClick={() => create.mutate()}>
                {m("create")}
              </Button>
            </>
          )}
          {create.isError ? (
            <p role="alert" className="text-destructive w-full">
              {errorMessage(create.error)}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Section>
  )
}

/** Event page: cover, details, RSVP, the check-in ticket and the album; organizers edit the event. */
export function EventPage() {
  const t = useT("activities")
  const media = useT("clubMedia")
  const common = useT("common")
  const errorMessage = useErrorMessage()
  const fmt = useFormatters()
  const id = useSearchParams().get("id")
  const event = useEvent(id)
  const rsvp = useMyRsvp(id)
  const { set, cancel } = useRsvpMutation(id ?? "")
  const going = rsvp.data != null && rsvp.data.status !== "cancelled" && rsvp.data.status !== "declined"
  const qr = useEventQr(id, going)
  const e = event.data
  const canManage = useClub(null, e?.club_id ?? null).viewer.canManageEvents
  const [editing, setEditing] = useState(false)
  const back = (
    <Link href="/activities/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
      <Icons.chevronLeft data-icon="inline-start" aria-hidden />
      {t("back")}
    </Link>
  )
  if (event.isPending)
    return (
      <PageContainer title={common("loading")} back={back}>
        {null}
      </PageContainer>
    )
  if (!e) {
    return (
      <PageContainer title={t("title")} back={back}>
        <p role="alert" className="text-muted-foreground text-sm">
          {event.isError ? errorMessage(event.error) : t("empty")}
        </p>
      </PageContainer>
    )
  }
  return (
    <PageContainer
      title={e.title}
      back={back}
      actions={
        <div className="flex flex-wrap gap-2">
          {canManage ? (
            <Button variant="outline" type="button" onClick={() => setEditing(true)}>
              <Icons.edit data-icon="inline-start" aria-hidden />
              {media("edit.action")}
            </Button>
          ) : null}
          {going ? (
            <Button variant="outline" type="button" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
              {t("cancelRsvp")}
            </Button>
          ) : (
            <Button type="button" disabled={set.isPending || e.status !== "scheduled"} onClick={() => set.mutate()}>
              {t("rsvp")}
            </Button>
          )}
        </div>
      }
    >
      {set.isError || cancel.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(set.error ?? cancel.error)}
        </p>
      ) : null}
      <EventCover mediaId={e.cover_media_id} className="aspect-video w-full max-w-3xl rounded-lg object-cover" />
      <Card>
        <CardContent className="grid gap-2 text-sm">
          <p className="flex items-center gap-2">
            <Icons.clock className="size-4" aria-hidden />
            {fmt.dateTime(e.starts_at)}
          </p>
          {e.location ? <p className="text-muted-foreground">{e.location}</p> : null}
          {e.description ? <p>{e.description}</p> : null}
          {e.capacity ? <p className="tabular-nums">{t("places", { count: e.capacity })}</p> : null}
        </CardContent>
      </Card>
      {going && qr.data ? (
        <Section title={t("ticket.title")} hint={t("ticket.hint")}>
          <Card>
            <CardContent>
              <p className="font-mono text-sm break-all">{qr.data.token}</p>
            </CardContent>
          </Card>
        </Section>
      ) : null}
      <EventAlbumCard eventId={e.id} canManage={canManage} />
      {editing ? <EditEventDialog event={e} open={editing} onOpenChange={setEditing} /> : null}
    </PageContainer>
  )
}
