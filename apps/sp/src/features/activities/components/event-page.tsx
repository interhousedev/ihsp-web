"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, buttonVariants, Card, CardContent, Icons, PageContainer } from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEvent, useEventQr, useMyRsvp, useRsvpMutation } from "../use-activities"
import { Section } from "./activity-ui"

/** Event page: details, RSVP and the check-in ticket. */
export function EventPage() {
  const t = useT("activities")
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
        going ? (
          <Button variant="outline" type="button" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
            {t("cancelRsvp")}
          </Button>
        ) : (
          <Button type="button" disabled={set.isPending || e.status !== "scheduled"} onClick={() => set.mutate()}>
            {t("rsvp")}
          </Button>
        )
      }
    >
      {set.isError || cancel.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(set.error ?? cancel.error)}
        </p>
      ) : null}
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
    </PageContainer>
  )
}
