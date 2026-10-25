"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { moveItem, newQuestion, type TestBlock } from "../utils/content-ops"
import { QuestionEditor } from "./question-editor"
import { TestConfigForm } from "./test-config-form"

/** The test builder (UF-LMS-14): settings and the list of questions. */
export function TestBlockEditor({
  block,
  keyOf,
  onChange,
}: {
  block: TestBlock
  keyOf: (id: string) => string
  onChange: (block: TestBlock) => void
}) {
  const t = useT("testBuilder")
  return (
    <div className="flex flex-col gap-4">
      <TestConfigForm config={block.config} onChange={(config) => onChange({ ...block, config })} />
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold">{t("questions", { count: block.questions.length })}</h4>
        <ol className="flex flex-col gap-3">
          {block.questions.map((question, index) => (
            <QuestionEditor
              key={keyOf(question.id)}
              question={question}
              index={index}
              total={block.questions.length}
              keyOf={keyOf}
              onChange={(next) =>
                onChange({
                  ...block,
                  questions: block.questions.map((item) => (item.id === question.id ? next : item)),
                })
              }
              onMove={(direction) =>
                onChange({
                  ...block,
                  questions: moveItem(block.questions, index, direction === "up" ? index - 1 : index + 1),
                })
              }
              onRemove={() =>
                onChange({
                  ...block,
                  questions: block.questions.filter((item) => item.id !== question.id),
                })
              }
            />
          ))}
        </ol>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              ...block,
              questions: [...block.questions, newQuestion("single")],
            })
          }
          className="w-fit min-h-11 md:min-h-7"
        >
          <Icons.add aria-hidden />
          {t("addQuestion")}
        </Button>
      </div>
    </div>
  )
}
