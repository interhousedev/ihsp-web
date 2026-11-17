"use client"

import { useSession } from "@ihsp/auth"
import { isStaffOnly } from "../../../config/nav"
import { tourKey } from "../tour-state"
import { TourGuide } from "./tour-guide"

/** The tour for applicants only; staff have no first-run path to learn. */
export function StudentTour() {
  const { session } = useSession()
  if (!session || isStaffOnly(session.user.roles)) return null
  return <TourGuide storageKey={tourKey(session.user.id)} />
}
