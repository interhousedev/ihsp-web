"use client"

import { keys, patchManageTopic, postManageTopic, type ManageTopic } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Dropdown,
} from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useState } from "react"
import { emptyLocalized, LocalizedFields, type Localized } from "../shared/localized-fields"

/** What the dialog works on: a new topic (under `parent`, or at the top) or an existing one. */
export type TopicTarget =
  | { mode: "create"; subjectId: string; parent: ManageTopic | null }
  | { mode: "edit"; topic: ManageTopic }

/** Create or edit a topic: the name in Uzbek, Russian and English (all three are required), slug, year of study. */
export function TopicDialog({ target, onClose }: { target: TopicTarget | null; onClose: () => void }) {
  const t = useT("library.manage.topics")
  const common = useT("common")
  const browse = useT("library.browse")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const id = useId()
  const [name, setName] = useState<Localized>(emptyLocalized())
  const [slug, setSlug] = useState("")
  const [year, setYear] = useState("")
  const [code, setCode] = useState("")
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    if (!target) return
    setAttempted(false)
    if (target.mode === "edit") {
      setName(target.topic.name)
      setSlug(target.topic.slug)
      setYear(target.topic.year_of_study ? String(target.topic.year_of_study) : "")
      setCode(target.topic.code ?? "")
    } else {
      setName(emptyLocalized())
      setSlug("")
      setYear("")
      setCode("")
    }
  }, [target])

  const save = useMutation({
    mutationFn: () => {
      if (!target) throw new Error("no target")
      const yearOfStudy = year ? Number(year) : null
      if (target.mode === "edit") {
        return patchManageTopic(target.topic.id, {
          name,
          slug: slug.trim() || undefined,
          year_of_study: yearOfStudy,
          code: code.trim() || null,
        })
      }
      return postManageTopic({
        subject_id: target.subjectId,
        parent_id: target.parent?.id ?? null,
        name,
        ...(slug.trim() ? { slug: slug.trim() } : {}),
        year_of_study: yearOfStudy,
        code: code.trim() || null,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.library.all() })
      onClose()
    },
  })

  const complete = name.uz.trim() !== "" && name.ru.trim() !== "" && name.en.trim() !== ""
  const title = target?.mode === "edit" ? t("editTitle") : target?.parent ? t("addChildTitle") : t("addTitle")

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {target?.mode === "create" && target.parent
              ? t("underParent", { name: target.parent.name.en })
              : t("namesRequired")}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            setAttempted(true)
            if (complete && !save.isPending) save.mutate()
          }}
        >
          <LocalizedFields label={t("name")} required values={name} showErrors={attempted} onChange={setName} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-slug`}>{t("slug")}</Label>
            <Input
              id={`${id}-slug`}
              value={slug}
              className="min-h-11 md:min-h-8"
              onChange={(event) => setSlug(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t("slugHint")}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-code`}>{t("code")}</Label>
            <Input
              id={`${id}-code`}
              value={code}
              maxLength={40}
              placeholder="УДК 37"
              className="min-h-11 md:min-h-8"
              onChange={(event) => setCode(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t("codeHint")}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-year`}>{t("year")}</Label>
            <Dropdown
              id={`${id}-year`}
              value={year}
              onValueChange={setYear}
              options={[
                { value: "", label: t("anyYear") },
                ...[1, 2].map((value) => ({ value: String(value), label: browse("year", { year: value }) })),
              ]}
            />
          </div>
          {save.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(save.error)}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={onClose}>
              {common("cancel")}
            </Button>
            <Button type="submit" className="min-h-11 md:min-h-8" disabled={save.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
