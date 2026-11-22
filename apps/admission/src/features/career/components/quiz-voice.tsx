"use client"

import { VoiceFill } from "@/components/voice-fill/voice-fill"
import type { QuestionnaireExtraContext } from "./questionnaire-wizard"

const TEXT_MAX = 200

/** "Talk in voice" for the short text line of one questionnaire question; the spoken answer lands in the line. */
export function QuizVoice({ question, setText }: QuestionnaireExtraContext) {
  if (!question.textKey || !question.textLabel) return null
  const label = question.textLabel
  return (
    <VoiceFill
      form="career_quiz_line"
      questions={[question.title, label]}
      fields={[{ key: "text", label, max_length: TEXT_MAX }]}
      onFill={(values) => {
        const value = values.text?.trim()
        if (value) setText(value.slice(0, TEXT_MAX))
      }}
    >
      {null}
    </VoiceFill>
  )
}
