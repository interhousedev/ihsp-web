"use client"

import { useT } from "@ihsp/i18n"
import { TagInput, useDebounce } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { VoiceFill, type VoiceFieldSpec } from "@/components/voice-fill/voice-fill"
import { ikigaiQuery, professionKeys, putIkigai, type Ikigai, type IkigaiCircle } from "../api"
import { CIRCLE_COLOR, CIRCLES, EMPTY_IKIGAI, filledCount, MAX_CHIPS } from "../model"
import { IkigaiVenn } from "./ikigai-venn"

/** Step 1: the four circles and the chips of the selected one; saved a moment after the last change. */
export function IkigaiStep() {
  const t = useT("professions")
  const client = useQueryClient()
  const stored = useQuery(ikigaiQuery())
  const [draft, setDraft] = useState<Ikigai | null>(null)
  const [active, setActive] = useState<IkigaiCircle>("love")
  const [saved, setSaved] = useState(false)
  const save = useMutation({
    mutationFn: putIkigai,
    onSuccess: (data) => {
      client.setQueryData(professionKeys.ikigai(), data)
      setSaved(true)
    },
  })
  const ikigai = draft ?? stored.data ?? EMPTY_IKIGAI
  const settled = useDebounce(draft, 700)
  const last = useRef<Ikigai | null>(null)
  useEffect(() => {
    if (!settled || settled === last.current) return
    last.current = settled
    save.mutate(settled)
  }, [settled, save])

  function change(circle: IkigaiCircle, tags: string[]) {
    setSaved(false)
    setDraft({ ...ikigai, [circle]: tags })
  }

  const specs: VoiceFieldSpec[] = CIRCLES.map((id) => ({
    key: id,
    label: `${t(`question.${id}`)} (short phrases separated by commas)`,
    max_length: 400,
  }))
  function fillFrom(values: Record<string, string>) {
    setSaved(false)
    const next = { ...ikigai }
    for (const id of CIRCLES) {
      const added = (values[id] ?? "")
        .split(/[,;\n]/)
        .map((tag) => tag.trim().slice(0, 60))
        .filter(Boolean)
      next[id] = [...new Set([...ikigai[id], ...added])].slice(0, MAX_CHIPS)
    }
    setDraft(next)
  }

  return (
    <VoiceFill form="ikigai" questions={CIRCLES.map((id) => t(`question.${id}`))} fields={specs} onFill={fillFrom}>
    <div className="grid items-center gap-4 md:grid-cols-2 md:gap-8">
      <IkigaiVenn ikigai={ikigai} active={active} onSelect={setActive} />
      <div className="flex flex-col gap-3">
        <div role="tablist" aria-label={t("venn.label")} className="grid grid-cols-2 gap-1.5">
          {CIRCLES.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={id === active}
              onClick={() => setActive(id)}
              className="focus-visible:ring-ring flex min-h-11 items-center gap-2 rounded-card border px-3 text-start text-sm font-medium outline-none focus-visible:ring-2 aria-selected:border-transparent aria-selected:bg-muted"
            >
              <span aria-hidden className="size-3 shrink-0 rounded-full" style={{ background: CIRCLE_COLOR[id] }} />
              <span className="min-w-0 flex-1">{t(`circle.${id}`)}</span>
              <span className="text-muted-foreground text-xs tabular-nums">{ikigai[id].length}</span>
            </button>
          ))}
        </div>
        <p className="text-sm font-medium" id="ikigai-q">
          {t(`question.${active}`)}
        </p>
        <TagInput
          value={ikigai[active]}
          onChange={(tags) => change(active, tags)}
          max={MAX_CHIPS}
          maxLength={60}
          aria-label={t(`question.${active}`)}
          placeholder={t("venn.placeholder")}
          removeLabel={(tag) => t("venn.remove", { tag })}
        />
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {save.isError
            ? t("venn.saveError")
            : saved
              ? t("venn.saved")
              : t("venn.hint", { count: filledCount(ikigai) })}
        </p>
      </div>
    </div>
    </VoiceFill>
  )
}
