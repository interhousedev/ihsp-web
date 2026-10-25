"use client"

import type { AssistantKind } from "@ihsp/api"
import { createContext, useContext, type ReactNode } from "react"

/** What an assistant offers; the shared chat module shows only the parts that are on. */
export type AssistantFeatures = {
  /** Notebooks: the sidebar section, "Ask a notebook", "Add to notebook". */
  notebooks: boolean
  /** Share a chat by link. */
  share: boolean
  /** Web search switch, guided learning, file upload and My files: the student's "+" menu. */
  plus: boolean
  /** The fast/smart picker on the home composer. */
  tier: boolean
}

const FEATURES: Record<AssistantKind, AssistantFeatures> = {
  student: { notebooks: true, share: true, plus: true, tier: true },
  admin: { notebooks: false, share: false, plus: false, tier: false },
  lms_author: { notebooks: false, share: false, plus: false, tier: false },
}

export type AssistantScope = {
  assistant: AssistantKind
  /** The author assistant works on one course. */
  courseId: string | undefined
  features: AssistantFeatures
}

const AssistantContext = createContext<AssistantScope>({
  assistant: "student",
  courseId: undefined,
  features: FEATURES.student,
})

type AssistantProviderProps = { assistant: AssistantKind; courseId?: string; children: ReactNode }

/** Tells every part of the chat module which assistant it talks to. Without a provider it is the student's. */
export function AssistantProvider({ assistant, courseId, children }: AssistantProviderProps) {
  return <AssistantContext value={{ assistant, courseId, features: FEATURES[assistant] }}>{children}</AssistantContext>
}

export function useAssistantScope(): AssistantScope {
  return useContext(AssistantContext)
}
