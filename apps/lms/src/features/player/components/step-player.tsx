"use client"

import { getLmsCoursePreviewStepQuery, getLmsCourseStepQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Badge, Card, CardContent, Icons, Markdown, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"
import { hrefs } from "../../shared/utils/hrefs"
import { useMarkViewed } from "../hooks/use-mark-viewed"
import { useStepOutline } from "../hooks/use-step-outline"
import { FlashcardsBlock } from "./flashcards-block"
import { StepNavigation } from "./step-navigation"
import { TestBlock } from "./test-block"
import { LinkButton } from "../../shared/components/link-button"

/**
 * The step player (UF-LMS-03, UF-LMS-04): Markdown blocks, test blocks and flash card blocks in order, with previous
 * and next links. `mode="preview"` shows the draft to staff with `view_drafts` under a "Preview" banner.
 */
export function StepPlayer({
  courseId,
  stepId,
  slug,
  mode,
}: {
  courseId: string
  stepId: string
  slug: string | null
  mode: "learn" | "preview"
}) {
  const t = useT("player")
  const preview = mode === "preview"
  const step = useQuery(
    preview ? getLmsCoursePreviewStepQuery(courseId, stepId) : getLmsCourseStepQuery(courseId, stepId),
  )
  const around = useStepOutline({ courseId, slug, preview })
  useMarkViewed({ courseId, stepId, slug: around.slug, step: step.data, enabled: !preview })

  const backHref = preview ? hrefs.edit(courseId) : around.slug ? hrefs.course(around.slug) : hrefs.myCourses()
  const stepHref = (id: string) =>
    preview ? hrefs.preview(courseId, id) : hrefs.step(courseId, id, around.slug ?? undefined)

  return (
    <PageContainer
      title={step.data?.title ?? t("title")}
      description={around.courseTitle ?? undefined}
      actions={
        <LinkButton href={backHref} variant="outline" className="min-h-11 md:min-h-8">
          <Icons.chevronLeft aria-hidden />
          {preview ? t("backToEditor") : t("backToCourse")}
        </LinkButton>
      }
    >
      {preview ? (
        <Alert role="status" data-testid="preview-banner">
          <Icons.info aria-hidden />
          <AlertDescription>
            <strong>{t("previewBanner")}</strong> {t("previewNote")}
          </AlertDescription>
        </Alert>
      ) : null}
      <QueryState query={step} rows={3}>
        {(data) => (
          <div className="flex flex-col gap-4">
            {data.completed && !preview ? (
              <Badge className="w-fit" variant="secondary">
                <Icons.circleCheck aria-hidden />
                {t("completed")}
              </Badge>
            ) : null}
            {data.blocks.length === 0 ? <p className="text-muted-foreground text-sm">{t("emptyStep")}</p> : null}
            {data.blocks.map((block) => {
              if (block.type === "text") {
                return (
                  <Card key={block.id}>
                    <CardContent>
                      <Markdown className="text-base">{block.markdown}</Markdown>
                    </CardContent>
                  </Card>
                )
              }
              if (block.type === "test") {
                return (
                  <TestBlock
                    key={block.id}
                    courseId={courseId}
                    stepId={stepId}
                    block={block}
                    preview={preview || data.preview}
                    slug={around.slug}
                  />
                )
              }
              return <FlashcardsBlock key={block.id} stepId={stepId} block={block} readOnly={preview || data.preview} />
            })}
            {around.outline ? <StepNavigation outline={around.outline} stepId={stepId} href={stepHref} /> : null}
          </div>
        )}
      </QueryState>
    </PageContainer>
  )
}
