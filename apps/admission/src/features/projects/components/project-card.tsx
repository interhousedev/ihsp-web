"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import type { Project } from "../api"
import { buildProjectPrompt } from "../prompt"
import { HelpersDrawer } from "./helpers-drawer"

export function ProjectCard({ project }: { project: Project }) {
  const t = useT("projects")
  const [helpers, setHelpers] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildProjectPrompt(project))
      toast.success(t("card.copied"))
    } catch {
      toast.error(t("card.copyFailed"))
    }
  }

  return (
    <li className="bg-card flex flex-col gap-3 rounded-card border p-4">
      <h3 className="text-lg font-semibold">{project.title}</h3>
      <p className="text-sm">{project.summary}</p>
      {project.analogs.length > 0 && (
        <section className="flex flex-col gap-1">
          <h4 className="text-sm font-medium">{t("card.analogs")}</h4>
          <ul className="flex flex-col gap-1">
            {project.analogs.map((a) => (
              <li key={`${a.name}-${a.where}`} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="bg-muted rounded-full px-2 py-0.5 text-xs">{t(`card.where.${a.where}`)}</span>
                {a.url ? (
                  <a
                    className="text-primary inline-flex min-h-11 items-center gap-1 underline sm:min-h-0"
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {a.name}
                    <Icons.externalLink className="size-3" aria-hidden />
                  </a>
                ) : (
                  <span>{a.name}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {project.challenges.length > 0 && (
        <section className="flex flex-col gap-1">
          <h4 className="text-sm font-medium">{t("card.challenges")}</h4>
          <ul className="list-disc pl-5 text-sm">
            {project.challenges.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="flex flex-col gap-1">
        <h4 className="text-sm font-medium">{t("card.effect")}</h4>
        <p className="text-sm">{project.application_effect}</p>
      </section>
      {project.first_steps.length > 0 && (
        <section className="flex flex-col gap-1">
          <h4 className="text-sm font-medium">{t("card.steps")}</h4>
          <ol className="list-decimal pl-5 text-sm">
            {project.first_steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>
      )}
      {project.help_tags.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label={t("card.help")}>
          {project.help_tags.map((tag) => (
            <li key={tag} className="border-primary/40 rounded-full border px-2 py-0.5 text-xs">
              {t(`helpTags.${tag}`)}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" className="min-h-11" onClick={() => void copy()}>
          <Icons.copy aria-hidden className="size-4" />
          {t("card.copyPrompt")}
        </Button>
        <Button type="button" size="sm" variant="outline" className="min-h-11" onClick={() => setHelpers(true)}>
          {t("card.helpers")}
        </Button>
      </div>
      {helpers && <HelpersDrawer open onOpenChange={setHelpers} title={project.title} tags={project.help_tags} />}
    </li>
  )
}
