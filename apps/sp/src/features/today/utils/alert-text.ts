import type { Alert } from "@ihsp/api"
import { formatTime } from "@ihsp/i18n"

/** `Alert.params` is open-ended JSON; the numbers and strings the messages need are read defensively. */
export function numberParam(alert: Alert, name: string): number {
  const value = alert.params[name]
  return typeof value === "number" ? value : 0
}

export function stringParam(alert: Alert, name: string): string | null {
  const value = alert.params[name]
  return typeof value === "string" ? value : null
}

/** The words of a `seminar_soon` alert: the subject, the start time in Tashkent and the lesson period. */
export function seminarAlertParams(alert: Alert): { subject: string; time: string; period: number } {
  const startsAt = stringParam(alert, "starts_at")
  return {
    subject: stringParam(alert, "subject_name") ?? "",
    time: startsAt ? formatTime(startsAt) : "",
    period: numberParam(alert, "period"),
  }
}
