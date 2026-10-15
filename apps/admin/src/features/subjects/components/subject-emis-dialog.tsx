"use client"

import {
  getAdminSubjectPeopleQuery,
  postAdminSubjectEmisPull,
  type Subject,
  type SubjectEmisPullBody,
  type SubjectPerson,
  type Term,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Checkbox,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { QueryState } from "../../shared/components/query-state"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { useTerms } from "../../shared/hooks/use-lookups"
import { TOUCH } from "../../shared/utils/touch"

const termKey = (term: Pick<Term, "academic_year" | "half">) => `${term.academic_year}/${term.half}`

function PeopleList({
  title,
  people,
  pending,
  onPull,
}: {
  title: string
  people: SubjectPerson[]
  pending: boolean
  onPull: (person: SubjectPerson) => void
}) {
  const t = useT("subjects.emis")
  if (people.length === 0) return null
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="flex flex-col divide-y rounded-md border" aria-label={title}>
        {people.map((person) => (
          <li key={person.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
            <span className="min-w-0 truncate">{person.name}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={TOUCH}
              disabled={pending}
              aria-label={t("pullNewFor", { name: person.name })}
              onClick={() => onPull(person)}
            >
              {t("pullNew")}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function EmisBody({ subject }: { subject: Subject }) {
  const t = useT("subjects.emis")
  const terms = useTerms()
  const people = useQuery(getAdminSubjectPeopleQuery(subject.id))
  const [picked, setPicked] = useState<Set<string> | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const list = terms.data ?? []
  const current = list.filter((term) => term.is_current)
  const chosen = picked ?? new Set(current.map(termKey))
  const selected = list.filter((term) => chosen.has(termKey(term)))
  // The current term alone is the server's default, so only another choice is sent.
  const onlyCurrent = selected.length === current.length && current.every((term) => chosen.has(termKey(term)))
  const termsBody = onlyCurrent ? {} : { terms: selected.map(({ academic_year, half }) => ({ academic_year, half })) }

  const pull = useAdminMutation({
    mutationFn: (body: SubjectEmisPullBody) => postAdminSubjectEmisPull(subject.id, { ...termsBody, ...body }),
    success: t("started"),
    onSuccess: () => setConfirmOpen(false),
  })

  function toggle(term: Term, on: boolean) {
    const next = new Set(chosen)
    if (on) next.add(termKey(term))
    else next.delete(termKey(term))
    setPicked(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("terms")}</legend>
        {list.map((term) => {
          const label = t("termLabel", { year: term.academic_year, half: term.half })
          return (
            <div key={term.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                id={`emis-pull-term-${term.id}`}
                aria-label={label}
                checked={chosen.has(termKey(term))}
                onCheckedChange={(checked) => toggle(term, checked === true)}
              />
              <label htmlFor={`emis-pull-term-${term.id}`}>{label}</label>
            </div>
          )
        })}
      </fieldset>
      <div>
        <Button
          type="button"
          className={TOUCH}
          disabled={selected.length === 0 || pull.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {t("pullAll")}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">{t("softHint")}</p>
      <QueryState query={people}>
        {(data) =>
          data.teachers.length === 0 && data.groups.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("none")}</p>
          ) : (
            <>
              <PeopleList
                title={t("teachers")}
                people={data.teachers}
                pending={pull.isPending || selected.length === 0}
                onPull={(person) => pull.mutate({ mode: "soft", teacher_id: person.id })}
              />
              <PeopleList
                title={t("groups")}
                people={data.groups}
                pending={pull.isPending || selected.length === 0}
                onPull={(person) => pull.mutate({ mode: "soft", group_id: person.id })}
              />
            </>
          )
        }
      </QueryState>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("confirmTitle")}
        description={t("confirmDescription")}
        confirmLabel={t("confirm")}
        loading={pull.isPending}
        onConfirm={() => pull.mutate({ mode: "full" })}
      />
    </div>
  )
}

/**
 * EMIS materials of one subject: "Pull from EMIS" replaces them in the chosen terms (the current one by default);
 * each teacher and group of the current term has "Pull new materials", which only fills lessons without materials.
 */
export function SubjectEmisDialog({
  subject,
  open,
  onOpenChange,
}: {
  subject: Subject | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("subjects.emis")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {subject ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("title", { name: subject.name.en })}</DialogTitle>
              <DialogDescription>{t("description")}</DialogDescription>
            </DialogHeader>
            <EmisBody key={subject.id} subject={subject} />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
