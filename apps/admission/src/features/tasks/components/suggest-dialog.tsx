"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Checkbox, LoadingButton, ResponsiveDialog, StateView } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { toTaskIn, useAcceptTasks, useSuggestTasks, type Task } from "../api"
import { PriorityPill } from "./task-common"

/** AI drafts: the student picks some and accepts them as tasks (created by "ai"). */
export function SuggestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("tasks")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const suggest = useSuggestTasks(locale)
  const accept = useAcceptTasks()
  const [drafts, setDrafts] = useState<Task[]>([])
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const { mutate } = suggest

  const asked = useRef(false)

  useEffect(() => {
    if (!open || asked.current) return
    asked.current = true
    mutate(undefined, {
      onSuccess: (out) => {
        setDrafts(out.items)
        setPicked(new Set(out.items.map((_, index) => index)))
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mutate])

  function toggle(index: number, on: boolean) {
    setPicked((all) => {
      const next = new Set(all)
      if (on) next.add(index)
      else next.delete(index)
      return next
    })
  }

  async function submit() {
    try {
      await accept.mutateAsync(drafts.filter((_, index) => picked.has(index)).map(toTaskIn))
      onOpenChange(false)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("suggestTitle")}
      footer={
        <LoadingButton
          type="button"
          loading={accept.isPending}
          disabled={picked.size === 0}
          onClick={() => void submit()}
        >
          {t("acceptSelected", { count: picked.size })}
        </LoadingButton>
      }
    >
      {suggest.isPending ? (
        <p className="text-muted-foreground text-sm">{t("suggesting")}</p>
      ) : drafts.length === 0 ? (
        <StateView state="empty" emptyText={t("suggestNone")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {drafts.map((draft, index) => (
            <li key={index} className="flex items-start gap-3 text-sm">
              <Checkbox
                aria-label={draft.title}
                checked={picked.has(index)}
                onCheckedChange={(value) => toggle(index, value === true)}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-1">
                <span className="font-medium">{draft.title}</span>
                {draft.description ? <span className="text-muted-foreground">{draft.description}</span> : null}
                <PriorityPill priority={draft.priority} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ResponsiveDialog>
  )
}
