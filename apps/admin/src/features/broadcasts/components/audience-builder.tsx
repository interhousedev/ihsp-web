"use client"

import type { Audience, Role } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { CheckField } from "../../shared/components/check-field"
import { useGroupOptions } from "../../shared/hooks/use-lookups"
import { useAudienceCount } from "../hooks/use-audience-count"
import { BROADCAST_ROLES, SEMESTERS } from "../utils/broadcast-form"

function toggle<T>(list: readonly T[], item: T, on: boolean): T[] {
  return on ? [...list.filter((value) => value !== item), item] : list.filter((value) => value !== item)
}

/** Everyone, or roles, groups and semesters (union); the number of recipients updates while filters change. */
export function AudienceBuilder({
  audience,
  onChange,
  disabled,
}: {
  audience: Audience
  onChange: (audience: Audience) => void
  disabled?: boolean
}) {
  const t = useT("broadcasts.audience")
  const groups = useGroupOptions()
  const count = useAudienceCount(audience)

  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border p-3" disabled={disabled}>
      <legend className="px-1 text-sm font-medium">{t("title")}</legend>
      <CheckField
        checked={audience.everyone}
        label={t("everyone")}
        onChange={(everyone) => onChange({ ...audience, everyone })}
      />
      <div className={audience.everyone ? "pointer-events-none opacity-50" : ""} aria-disabled={audience.everyone}>
        <div className="grid gap-4 md:grid-cols-3">
          <section className="flex flex-col">
            <h4 className="text-muted-foreground text-xs font-medium uppercase">{t("roles")}</h4>
            {BROADCAST_ROLES.map((role: Role) => (
              <CheckField
                key={role}
                checked={audience.roles.includes(role)}
                disabled={audience.everyone}
                label={t(`role.${role}`)}
                onChange={(on) => onChange({ ...audience, roles: toggle(audience.roles, role, on) })}
              />
            ))}
          </section>
          <section className="flex flex-col">
            <h4 className="text-muted-foreground text-xs font-medium uppercase">{t("groups")}</h4>
            <div className="max-h-48 overflow-y-auto">
              {(groups.data ?? []).map((group) => (
                <CheckField
                  key={group.id}
                  checked={audience.group_ids.includes(group.id)}
                  disabled={audience.everyone}
                  label={group.name}
                  onChange={(on) => onChange({ ...audience, group_ids: toggle(audience.group_ids, group.id, on) })}
                />
              ))}
            </div>
          </section>
          <section className="flex flex-col">
            <h4 className="text-muted-foreground text-xs font-medium uppercase">{t("semesters")}</h4>
            <div className="grid grid-cols-2">
              {SEMESTERS.map((semester) => (
                <CheckField
                  key={semester}
                  checked={audience.semesters.includes(semester)}
                  disabled={audience.everyone}
                  label={t("semester", { number: semester })}
                  onChange={(on) =>
                    onChange({
                      ...audience,
                      semesters: toggle(audience.semesters, semester, on).toSorted((a, b) => a - b),
                    })
                  }
                />
              ))}
            </div>
          </section>
        </div>
      </div>
      <p className="text-sm font-medium" role="status" aria-live="polite" data-testid="audience-count">
        {count.count === null
          ? count.failed
            ? t("countFailed")
            : t("counting")
          : t("recipients", { count: count.count })}
      </p>
    </fieldset>
  )
}
