"use client"

import { getStaffJournalOptionsQuery, getStaffJournalQuery } from "@ihsp/api"
import { useQueries, useQuery } from "@tanstack/react-query"
import { buildStudentIndex, type StudentSummary, type TeacherJournal } from "../utils"

/**
 * Every student of every subject and audience the teacher teaches, from the journals (there is no endpoint for "my
 * students"). The journals load in parallel and stay cached for the journal page too.
 */
export function useTeacherStudents(): { students: StudentSummary[]; isPending: boolean; error: unknown } {
  const optionsQuery = useQuery(getStaffJournalOptionsQuery())
  const options = optionsQuery.data ?? []
  const journals = useQueries({
    queries: options.map((option) =>
      getStaffJournalQuery({ subject_id: option.subject.id, audience_key: option.audience_key }),
    ),
  })
  const loaded: TeacherJournal[] = []
  options.forEach((option, index) => {
    const journal = journals[index]?.data
    if (journal) loaded.push({ option, journal })
  })
  return {
    students: buildStudentIndex(loaded),
    isPending: optionsQuery.isPending || (journals.length > 0 && journals.every((query) => query.isPending)),
    error: optionsQuery.error ?? journals.find((query) => query.error)?.error ?? null,
  }
}
