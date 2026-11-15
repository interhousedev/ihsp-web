"use client"

import { getMeStudentCardQuery } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { retryCardQuery } from "../../student-card/components/student-card-error"

/** Who is signed in for the home header: full name, the `group | N-course` line and whether a photo exists. */
export function useHomeStudent() {
  const t = useT("home")
  const { session } = useSession()
  const query = useQuery({ ...getMeStudentCardQuery(), retry: retryCardQuery })
  const card = query.data
  const user = session?.user
  const name = card
    ? `${card.first_name} ${card.last_name}`.trim()
    : user
      ? `${user.first_name} ${user.last_name}`.trim()
      : ""
  const parts = card
    ? [card.group || null, card.course != null ? t("course", { course: card.course }) : null].filter(
        (part): part is string => part !== null,
      )
    : []
  return {
    name,
    line: parts.join(" | "),
    photoUrl: (card ? card.has_photo : Boolean(user?.photo_url)) ? (user?.photo_url ?? null) : null,
    pending: query.isPending,
  }
}
