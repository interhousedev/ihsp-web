"use client"

import { deleteManageTopic, getLibrarySubjectsQuery, getManageTopicsQuery, keys } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Label, NativeSelect, NativeSelectOption, PageContainer, StateView } from "@ihsp/ui"
import { IconPlus } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { pickLocalized } from "../shared/localized-fields"
import { TopicDialog, type TopicTarget } from "./topic-dialog"
import { TopicTreeNode } from "./topic-node"
import { buildTopicTree, descendantCount, type TopicNode } from "./topic-tree"

/**
 * `/manage/topics/`: the topic tree of one subject. Add a topic at the top or under another, edit its names (Uzbek,
 * Russian and English are all required), slug and year of study, delete it with everything below it.
 */
export function TopicsPage() {
  const t = useT("library.manage.topics")
  const errorMessage = useErrorMessage()
  const { locale } = useFormatters()
  const queryClient = useQueryClient()
  const subjects = useQuery(getLibrarySubjectsQuery({ all: true }))
  const [chosen, setChosen] = useState<string | null>(null)
  const subjectId = chosen ?? subjects.data?.[0]?.id ?? null
  const topics = useQuery({ ...getManageTopicsQuery({ subject_id: subjectId ?? "" }), enabled: subjectId !== null })
  const tree = useMemo(() => buildTopicTree(topics.data ?? []), [topics.data])
  const [target, setTarget] = useState<TopicTarget | null>(null)
  const [deleting, setDeleting] = useState<TopicNode | null>(null)

  const remove = useMutation({
    mutationFn: (node: TopicNode) => deleteManageTopic(node.id),
    onSuccess: async () => {
      setDeleting(null)
      await queryClient.invalidateQueries({ queryKey: keys.library.all() })
    },
  })

  const subjectName = subjects.data?.find((subject) => subject.id === subjectId)?.name ?? ""

  return (
    <PageContainer
      title={t("title")}
      description={t("description")}
      actions={
        <Button
          type="button"
          className="min-h-11 md:min-h-8"
          disabled={!subjectId}
          onClick={() => subjectId && setTarget({ mode: "create", subjectId, parent: null })}
        >
          <IconPlus aria-hidden />
          {t("add")}
        </Button>
      }
    >
      {subjects.isPending ? (
        <StateView state="loading" rows={2} />
      ) : subjects.isError ? (
        <StateView state="error" error={subjects.error} onRetry={() => void subjects.refetch()} />
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="topics-subject">{t("subject")}</Label>
            <NativeSelect
              id="topics-subject"
              value={subjectId ?? ""}
              className="w-full sm:w-72"
              onChange={(event) => setChosen(event.target.value)}
            >
              {subjects.data.map((subject) => (
                <NativeSelectOption key={subject.id} value={subject.id}>
                  {subject.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          {topics.isPending && subjectId ? (
            <StateView state="loading" rows={3} />
          ) : topics.isError ? (
            <StateView state="error" error={topics.error} onRetry={() => void topics.refetch()} />
          ) : tree.length === 0 ? (
            <StateView
              state="empty"
              emptyText={t("empty", { subject: subjectName })}
              action={
                subjectId ? (
                  <Button
                    type="button"
                    className="min-h-11 md:min-h-8"
                    onClick={() => setTarget({ mode: "create", subjectId, parent: null })}
                  >
                    <IconPlus aria-hidden />
                    {t("add")}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul aria-label={t("treeLabel", { subject: subjectName })} className="flex flex-col gap-2">
              {tree.map((node) => (
                <TopicTreeNode
                  key={node.id}
                  node={node}
                  onAdd={(parent) => subjectId && setTarget({ mode: "create", subjectId, parent })}
                  onEdit={(topic) => setTarget({ mode: "edit", topic })}
                  onDelete={setDeleting}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      <TopicDialog target={target} onClose={() => setTarget(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
          remove.reset()
        }}
        title={t("deleteTitle")}
        description={
          deleting
            ? t(descendantCount(deleting) > 0 ? "deleteTextChildren" : "deleteText", {
                name: pickLocalized(deleting.name, locale),
              })
            : undefined
        }
        confirmLabel={t("deleteConfirm")}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting)
        }}
      >
        {remove.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(remove.error)}
          </p>
        ) : null}
      </ConfirmDialog>
    </PageContainer>
  )
}
