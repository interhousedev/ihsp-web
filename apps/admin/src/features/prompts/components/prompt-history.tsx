"use client"

import { activateAdminPrompt, keys, type PromptDetail, type PromptVersion } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button } from "@ihsp/ui"
import { useState } from "react"
import { PromptVersionDiff } from "../../ai-harness/components/prompt-version-diff"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"

/** The stored versions of a slot, newest first; any of them can be made the active one again. */
export function PromptHistory({ detail }: { detail: PromptDetail }) {
  const t = useT("prompts")
  const th = useT("aiHarness.prompts")
  const [diffOf, setDiffOf] = useState<number | null>(null)
  const f = useFormatters()
  const activate = useAdminMutation<PromptVersion, PromptVersion>({
    mutationFn: (version) => activateAdminPrompt({ task: detail.task, name: detail.name, version: version.version }),
    invalidate: [keys.admin.prompts.all()],
    success: (data) => t("history.activated", { version: data.version }),
  })
  if (detail.versions.length === 0) return <p className="text-muted-foreground text-sm">{t("history.empty")}</p>
  const oldest = Math.min(...detail.versions.map((version) => version.version))
  return (
    <ul className="flex flex-col divide-y">
      {[...detail.versions]
        .sort((a, b) => b.version - a.version)
        .map((version) => (
          <li key={version.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium">
                {t("history.version", { version: version.version })}
                {version.locale ? ` · ${version.locale}` : ` · ${t("locales.all")}`}
              </span>
              <span className="text-muted-foreground text-xs">
                {f.dateTime(new Date(version.created_at))}
                {version.note ? ` · ${version.note}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {version.version > oldest ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-pressed={diffOf === version.version}
                  aria-label={th("showChanges", { version: version.version })}
                  onClick={() => setDiffOf(diffOf === version.version ? null : version.version)}
                >
                  {th("changes")}
                </Button>
              ) : null}
              {version.active ? (
                <Badge>{t("history.active")}</Badge>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={activate.isPending}
                  aria-label={t("history.activateVersion", { version: version.version })}
                  onClick={() => activate.mutate(version)}
                >
                  {t("history.activate")}
                </Button>
              )}
            </div>
            {diffOf === version.version ? (
              <div className="w-full">
                <PromptVersionDiff task={detail.task} name={detail.name} locale={version.locale} to={version.version} />
              </div>
            ) : null}
          </li>
        ))}
    </ul>
  )
}
