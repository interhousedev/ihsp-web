"use client"

import { getStaffSubjectsQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { QueryState } from "../../shared/components/query-state"
import { byGroup } from "../utils/groups"
import { subjectHref } from "../utils/hrefs"

/** `/subjects/`: the subjects the teacher teaches this term, each with its groups. */
export function SubjectsPage() {
  const t = useT("subjects")
  const query = useQuery(getStaffSubjectsQuery())
  return (
    <PageContainer title={t("title")} description={t("description")}>
      <QueryState query={query} isEmpty={(subjects) => subjects.length === 0} emptyText={t("empty")} rows={3}>
        {(subjects) => (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <li key={subject.subject_id}>
                <Link
                  href={subjectHref(subject.subject_id)}
                  className="bg-card hover:bg-muted/50 focus-visible:ring-ring ring-foreground/10 flex min-h-24 flex-col gap-1 rounded-xl p-4 ring-1 outline-none focus-visible:ring-2"
                >
                  <span className="font-medium break-words">{subject.name}</span>
                  <span className="text-muted-foreground text-sm">
                    {byGroup(subject.groups)
                      .map((group) => group.group_name)
                      .join(", ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </PageContainer>
  )
}
