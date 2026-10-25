"use client"

import { postCalendarToken, type CalendarTokenResponse } from "@ihsp/api"
import { useMutation } from "@tanstack/react-query"

/** `POST /v1/me/calendar-token`: every call makes a new secret feed URL and disables the previous one (WEB-6). */
export function useCalendarToken() {
  return useMutation<CalendarTokenResponse>({ mutationFn: () => postCalendarToken() })
}
