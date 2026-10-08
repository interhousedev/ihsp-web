"use client"

import type { StepContent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, AlertTitle, Icons } from "@ihsp/ui"
import { validateContent } from "../utils/content-ops"

/** Problems to fix before publishing (a question without a correct option, an empty prompt, and so on). */
export function ContentIssues({ content }: { content: StepContent }) {
  const t = useT("issues")
  const issues = validateContent(content)
  if (issues.length === 0) return null
  const blockNumber = (blockId: string) => content.blocks.findIndex((block) => block.id === blockId) + 1
  const questionNumber = (blockId: string, questionId?: string) => {
    const block = content.blocks.find((item) => item.id === blockId)
    return block?.type === "test" ? block.questions.findIndex((question) => question.id === questionId) + 1 : 0
  }
  return (
    <Alert data-testid="content-issues">
      <Icons.warning aria-hidden />
      <AlertTitle>{t("title")}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc ps-4">
          {issues.map((issue, index) => (
            <li key={`${issue.code}-${issue.blockId}-${issue.questionId ?? index}`}>
              {issue.questionId
                ? t(`codes.${issue.code}`, {
                    block: blockNumber(issue.blockId),
                    question: questionNumber(issue.blockId, issue.questionId),
                  })
                : t(`codes.${issue.code}`, { block: blockNumber(issue.blockId), question: 0 })}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
