"use client"

import { useSession } from "@ihsp/auth"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, Skeleton, Switch } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId } from "react"
import { toast } from "sonner"
import { isStaffOnly } from "../../../config/nav"
import { mentoringKeys, mentoringQuery, putMenteeOptIn, putMentorOptIn } from "../../mentoring/api"

function SwitchRow({
  label,
  text,
  checked,
  busy,
  onChange,
}: {
  label: string
  text: string
  checked: boolean
  busy: boolean
  onChange: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <div className="grid gap-0.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <p className="text-muted-foreground text-sm">{text}</p>
      </div>
      <Switch id={id} checked={checked} disabled={busy} onCheckedChange={onChange} />
    </li>
  )
}

/** Mentoring opt-ins: an applicant shares the profile with a mentor, a mentor accepts; access needs both. */
export function MentoringSwitches() {
  const t = useT("privacy")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const { session } = useSession()
  const state = useQuery(mentoringQuery())
  const mentee = useMutation({
    mutationFn: putMenteeOptIn,
    onSuccess: (data) => {
      queryClient.setQueryData(mentoringKeys.state(), data)
      toast.success(t("mentoring.saved"))
    },
  })
  const mentor = useMutation({
    mutationFn: putMentorOptIn,
    onSuccess: (data) => {
      queryClient.setQueryData(mentoringKeys.state(), data)
      toast.success(t("mentoring.saved"))
    },
  })

  const data = state.data
  const showMentee = !isStaffOnly(session?.user.roles)
  const showMentor = (data?.mentor_assignments ?? 0) > 0
  if (data && !showMentee && !showMentor) return null

  return (
    <section className="grid gap-2" aria-labelledby="mentoring-title">
      <h2 id="mentoring-title" className="text-base font-semibold">
        {t("mentoring.title")}
      </h2>
      <p className="text-muted-foreground text-sm">{t(showMentee ? "mentoring.intro" : "mentoring.introMentor")}</p>
      {state.isPending ? <Skeleton className="h-20 w-full" /> : null}
      {state.isError ? <Alert variant="destructive">{errorMessage(state.error)}</Alert> : null}
      {data ? (
        <ul className="divide-y">
          {showMentee ? (
            <SwitchRow
              label={t("mentoring.mentee.label")}
              text={t("mentoring.mentee.text")}
              checked={data.mentee_opt_in}
              busy={mentee.isPending}
              onChange={(checked) => mentee.mutate(checked)}
            />
          ) : null}
          {showMentor ? (
            <SwitchRow
              label={t("mentoring.mentor.label")}
              text={t("mentoring.mentor.text")}
              checked={data.mentor_opt_in}
              busy={mentor.isPending}
              onChange={(checked) => mentor.mutate(checked)}
            />
          ) : null}
        </ul>
      ) : null}
      {mentee.isError || mentor.isError ? (
        <Alert variant="destructive">{errorMessage(mentee.error ?? mentor.error)}</Alert>
      ) : null}
    </section>
  )
}
