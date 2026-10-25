"use client"

import { keys, patchManageSubject, postManageSubject, type ManageSubject } from "@ihsp/api"
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
import { useEffect, useId, useMemo, useState } from "react"
import { emptyLocalized, LocalizedFields, type Localized } from "../shared/localized-fields"
import { buildTree, subtreeIds, type TreeNode } from "../shared/tree"

/** What the dialog works on: a new subject (under `parent`, or at the top) or an existing one. */
export type SubjectTarget = { mode: "create"; parent: ManageSubject | null } | { mode: "edit"; subject: ManageSubject }

/** The subjects as an indented list for the "Under" select, skipping the edited subject and everything below it. */
function parentChoices(
  all: readonly ManageSubject[],
  exclude: Set<string>,
): { id: string; depth: number; subject: ManageSubject }[] {
  const out: { id: string; depth: number; subject: ManageSubject }[] = []
  const walk = (nodes: TreeNode<ManageSubject>[], depth: number) => {
    for (const node of nodes) {
      if (exclude.has(node.id)) continue
      out.push({ id: node.id, depth, subject: node })
      walk(node.children, depth + 1)
    }
  }
  walk(buildTree(all), 0)
  return out
}

/** Create or edit a subject: the name in Uzbek, Russian and English (all required), the optional ББК or УДК code, the
 * short address name and the subject it sits under. */
export function SubjectDialog({
  target,
  subjects,
  onClose,
}: {
  target: SubjectTarget | null
  subjects: readonly ManageSubject[]
  onClose: () => void
}) {
  const t = useT("library.manage.subjects")
  const common = useT("common")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const id = useId()
  const [name, setName] = useState<Localized>(emptyLocalized())
  const [code, setCode] = useState("")
  const [slug, setSlug] = useState("")
  const [parentId, setParentId] = useState("")
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    if (!target) return
    setAttempted(false)
    if (target.mode === "edit") {
      setName(target.subject.name)
      setCode(target.subject.code ?? "")
      setSlug(target.subject.slug)
      setParentId(target.subject.parent_id ?? "")
    } else {
      setName(emptyLocalized())
      setCode("")
      setSlug("")
      setParentId(target.parent?.id ?? "")
    }
  }, [target])

  const exclude = useMemo(
    () => (target?.mode === "edit" ? subtreeIds(subjects, target.subject.id) : new Set<string>()),
    [subjects, target],
  )
  const choices = useMemo(() => parentChoices(subjects, exclude), [subjects, exclude])

  const save = useMutation({
    mutationFn: () => {
      if (!target) throw new Error("no target")
      const body = {
        name,
        code: code.trim() || null,
        parent_id: parentId || null,
        ...(slug.trim() ? { slug: slug.trim() } : {}),
      }
      if (target.mode === "edit") return patchManageSubject(target.subject.id, body)
      return postManageSubject(body)
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
          <DialogDescription>{t("namesRequired")}</DialogDescription>
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
            <Label htmlFor={`${id}-code`}>{t("code")}</Label>
            <Input
              id={`${id}-code`}
              value={code}
              maxLength={40}
              placeholder="ББК 74"
              className="min-h-11 md:min-h-8"
              onChange={(event) => setCode(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t("codeHint")}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-parent`}>{t("parent")}</Label>
            <Dropdown
              id={`${id}-parent`}
              value={parentId}
              className="w-full"
              onValueChange={setParentId}
              options={[
                { value: "", label: t("parentTop") },
                ...choices.map((choice) => ({
                  value: choice.id,
                  label: `${"– ".repeat(choice.depth)}${choice.subject.name.en}`,
                })),
              ]}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-slug`}>{t("slug")}</Label>
            <Input
              id={`${id}-slug`}
              value={slug}
              maxLength={80}
              className="min-h-11 md:min-h-8"
              onChange={(event) => setSlug(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t("slugHint")}</p>
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
