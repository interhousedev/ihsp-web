"use client"

import { AttendanceRedirect } from "@/features/attendance/components/attendance-redirect"

/** Attendance now lives in the calendar; this address only redirects there. */
export default function Page() {
  return <AttendanceRedirect />
}
