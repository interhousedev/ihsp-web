"use client"

import { getMeStudentCardQuery } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { fullName } from "../../shared/utils/people"
import { retryCardQuery } from "../../student-card/components/student-card-error"

/**
 * Who is signed in for the home header: full name (the same display name as the menu), the `group | N-course` line and
 * the photo. The photo is the session's `/v1/id/me` `photo_url`; the student card only says whether one exists and has
 * no address, so it never gates the photo.
 */
export function useHomeStudent() {
  const t = useT("home")
  const { session } = useSession()
  const query = useQuery({ ...getMeStudentCardQuery(), retry: retryCardQuery })
  const card = query.data
  const user = session?.user
  const person = card ?? user
  const name = person ? fullName(person) : ""
  const parts = card
    ? [card.group || null, card.course != null ? t("course", { course: card.course }) : null].filter(
        (part): part is string => part !== null,
      )
    : []
  return {
    name,
    line: parts.join(" | "),
    photoUrl: user?.photo_url ?? null,
    pending: query.isPending,
  }
}
