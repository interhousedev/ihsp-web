import type { Alert } from "@ihsp/api";

/** `Alert.params` is open-ended JSON; the numbers and strings the messages need are read defensively. */
export function numberParam(alert: Alert, name: string): number {
  const value = alert.params[name];
  return typeof value === "number" ? value : 0;
}

export function stringParam(alert: Alert, name: string): string | null {
  const value = alert.params[name];
  return typeof value === "string" ? value : null;
}
