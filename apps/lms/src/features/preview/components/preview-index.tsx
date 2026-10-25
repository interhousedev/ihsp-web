"use client"

import { getLmsCourseDraftQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { EditorFrame } from "../../editor/components/editor-frame"
import { OutlineBadge } from "../../shared/components/outline-badge"
import { QueryState } from "../../shared/components/query-state"
import { hrefs } from "../../shared/utils/hrefs"
import { flattenOutline } from "../../shared/utils/outline"
import { LinkButton } from "../../shared/components/link-button"

/** `/edit/preview/?id=` without a step: the draft outline as a student would see it after publishing (UF-LMS-09). */
export function PreviewIndex({ courseId }: { courseId: string }) {
  const t = useT("preview")
  const draft = useQuery(getLmsCourseDraftQuery(courseId))
  return (
    <EditorFrame courseId={courseId} current="preview" title={t("title")} requires={["view_drafts"]}>
      {() => (
        <div className="flex flex-col gap-4">
          <Alert role="status" data-testid="preview-banner">
            <Icons.info aria-hidden />
            <AlertDescription>
              <strong>{t("banner")}</strong> {t("note")}
            </AlertDescription>
          </Alert>
          <QueryState query={draft} rows={3}>
            {(data) => {
              const first = flattenOutline(data.outline)[0]
              return (
                <div className="flex flex-col gap-4">
                  {first ? (
                    <div>
                      <LinkButton href={hrefs.preview(courseId, first.step_id)} className="min-h-11 md:min-h-8">
                        {t("start")}
                      </LinkButton>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">{t("empty")}</p>
                  )}
                  <ol className="flex flex-col gap-4">
                    {data.outline.map((section) => (
                      <li key={section.id}>
                        <h2 className="mb-2 text-sm font-semibold">{section.title}</h2>
                        <ul className="flex flex-col divide-y rounded-lg border">
                          {section.steps.map((step) => (
                            <li key={step.step_id}>
                              <Link
                                href={hrefs.preview(courseId, step.step_id)}
                                className="hover:bg-muted/60 flex min-h-11 items-center gap-3 px-3 py-2 text-sm"
                              >
                                <span className="min-w-0 flex-1 break-words">{step.title}</span>
                                <OutlineBadge kind={step.badge} />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ol>
                </div>
              )
            }}
          </QueryState>
        </div>
      )}
    </EditorFrame>
  )
}
