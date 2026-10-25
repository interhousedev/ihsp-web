"use client"

import { keys, postLessonResourceHide, type LessonSourceItem } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, Button, buttonVariants, cn, formatBytes, Icons } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/** One lesson material: open it, and hide or show it for the students of its group. */
export function LessonSourceRow({ item, subjectId }: { item: LessonSourceItem; subjectId: string }) {
  const t = useT("subjects.lessonSources")
  const errorMessage = useErrorMessage()
  const client = useQueryClient()
  const toggle = useMutation({
    mutationFn: () => postLessonResourceHide(item.lesson_id, item.link_id, { hidden: !item.hidden }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.staffSubjects.lessonSourcesAll(subjectId) }),
  })
  return (
    <li className="flex flex-col gap-1 rounded-lg border p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-medium break-words">{item.title}</span>
          <span className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary">{item.group_name}</Badge>
            {item.hidden ? <Badge variant="outline">{t("hidden")}</Badge> : null}
            {item.hidden_by_rule ? <Badge variant="outline">{t("hiddenByRule")}</Badge> : null}
            {item.file ? (
              <span className="text-muted-foreground min-w-0 truncate" title={item.file.name}>
                {t("file", { name: item.file.name, size: formatBytes(item.file.byte_size) })}
              </span>
            ) : item.target_url ? (
              <span className="text-muted-foreground min-w-0 truncate" title={item.target_url}>
                {item.target_url}
              </span>
            ) : null}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            disabled={toggle.isPending}
            aria-label={item.hidden ? t("show", { title: item.title }) : t("hide", { title: item.title })}
            onClick={() => toggle.mutate()}
          >
            {item.hidden ? <Icons.eye aria-hidden /> : <Icons.eyeOff aria-hidden />}
          </Button>
          <a
            href={item.short_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-11 md:size-8")}
            aria-label={t("openItem", { title: item.title })}
          >
            <Icons.externalLink aria-hidden />
          </a>
        </div>
      </div>
      {toggle.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(toggle.error)}
        </p>
      ) : null}
    </li>
  )
}
