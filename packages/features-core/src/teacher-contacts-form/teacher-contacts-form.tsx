"use client"

import type { TeacherContacts } from "@ihsp/api"
import { isApiError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Input, Label, LoadingButton, StateView, Textarea } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query"
import { useEffect, useId, useState } from "react"
import { toast } from "sonner"

type Draft = { [K in keyof TeacherContacts]: string }

const EMPTY: Draft = { telegram: "", phone: "", email: "", office: "", office_hours: "", note: "" }

function toDraft(contacts: TeacherContacts): Draft {
  return {
    telegram: contacts.telegram ?? "",
    phone: contacts.phone ?? "",
    email: contacts.email ?? "",
    office: contacts.office ?? "",
    office_hours: contacts.office_hours ?? "",
    note: contacts.note ?? "",
  }
}

function toBody(draft: Draft): TeacherContacts {
  const clean = (value: string) => value.trim() || null
  return {
    telegram: clean(draft.telegram),
    phone: clean(draft.phone),
    email: clean(draft.email),
    office: clean(draft.office),
    office_hours: clean(draft.office_hours),
    note: clean(draft.note),
  }
}

export type TeacherContactsFormProps = {
  queryKey: QueryKey
  load: (signal?: AbortSignal) => Promise<TeacherContacts>
  save: (body: TeacherContacts) => Promise<TeacherContacts>
}

/** The public contacts of a teacher (Telegram, phone, email, office, office hours, a note), shown to their students. */
export function TeacherContactsForm({ queryKey, load, save }: TeacherContactsFormProps) {
  const t = useT("teacherContacts")
  const queryClient = useQueryClient()
  const formId = useId()
  const query = useQuery({ queryKey, queryFn: ({ signal }) => load(signal) })
  const [draft, setDraft] = useState<Draft>(EMPTY)

  useEffect(() => {
    if (query.data) setDraft(toDraft(query.data))
  }, [query.data])

  const mutation = useMutation({
    mutationFn: () => save(toBody(draft)),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKey, saved)
      toast.success(t("saved"))
    },
  })
  const failure = mutation.isError
    ? isApiError(mutation.error) && mutation.error.status === 422
      ? t("invalid")
      : t("saveFailed")
    : null

  if (query.isPending) return <StateView state="loading" rows={2} />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />

  const field = (
    name: keyof Draft,
    label: string,
    props: { type?: string; inputMode?: "tel" | "email" | "text"; placeholder?: string } = {},
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`${formId}-${name}`}>{label}</Label>
      <Input
        id={`${formId}-${name}`}
        value={draft[name]}
        className="h-11 md:h-8"
        onChange={(event) => setDraft({ ...draft, [name]: event.target.value })}
        {...props}
      />
    </div>
  )

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {field("telegram", t("telegram"), { placeholder: "username" })}
        {field("phone", t("phone"), { type: "tel", inputMode: "tel", placeholder: "+998 90 123-45-67" })}
        {field("email", t("email"), { type: "email", inputMode: "email" })}
        {field("office", t("office"))}
      </div>
      {field("office_hours", t("officeHours"))}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-note`}>{t("note")}</Label>
        <Textarea
          id={`${formId}-note`}
          rows={3}
          maxLength={500}
          value={draft.note}
          onChange={(event) => setDraft({ ...draft, note: event.target.value })}
        />
      </div>
      {failure ? (
        <p role="alert" className="text-destructive text-sm">
          {failure}
        </p>
      ) : null}
      <div>
        <LoadingButton type="submit" className="min-h-11 md:min-h-8" loading={mutation.isPending}>
          {t("save")}
        </LoadingButton>
      </div>
    </form>
  )
}
