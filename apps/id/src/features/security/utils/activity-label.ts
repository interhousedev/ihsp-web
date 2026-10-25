import type { Translate } from "../../shared/hooks/use-tr"

/** `auth.login` -> `security.activity.types.auth_login`; unknown event types are shown as they are. */
export function activityLabel(t: Translate, type: string): string {
  const key = `security.activity.types.${type.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`
  return t.has(key) ? t(key) : type
}
