"use client"

import { useSession } from "@ihsp/auth"
import { isStaffOnly } from "../../../config/nav"
import { useIsAlumnus } from "../../../config/applicant"
import { tourKey } from "../tour-state"
import { TourGuide } from "./tour-guide"

/** The tour for applicants only; staff have no first-run path to learn. */
export function StudentTour() {
  const { session } = useSession()
  const alumnus = useIsAlumnus()
  if (!session || isStaffOnly(session.user.roles, alumnus)) return null
  return <TourGuide storageKey={tourKey(session.user.id)} />
}
