"use client"

import { useT } from "@ihsp/i18n"

/** Texts of the questions and their options; an id the web has no text for is shown as it is. */
export function useProfileText() {
  const t = useT("profile")
  return {
    label: (id: string) => (t.has(`q.${id}.label`) ? t(`q.${id}.label`) : id),
    hint: (id: string) => (t.has(`q.${id}.hint`) ? t(`q.${id}.hint`) : null),
    optionHint: (option: string) => (t.has(`oh.${option}`) ? t(`oh.${option}`) : undefined),
    section: (id: string) => (t.has(`section.${id}`) ? t(`section.${id}`) : id),
    sectionIntro: (id: string) => (t.has(`sectionIntro.${id}`) ? t(`sectionIntro.${id}`) : null),
    option: (questionId: string, option: string) => {
      if (t.has(`o.${questionId}.${option}`)) return t(`o.${questionId}.${option}`)
      return t.has(`o.${option}`) ? t(`o.${option}`) : option
    },
  }
}
