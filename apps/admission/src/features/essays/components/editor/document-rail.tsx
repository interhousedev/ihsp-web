"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, cn } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useCreateEssay, useEssays } from "../../api"
import { useEssayLabel } from "../supp-label"

/** "Document tabs": this application's essays (personal essay and supplements), the open one as a filled pill. */
export function DocumentRail({
  currentId,
  liveTitle,
  onNavigate,
}: {
  currentId: string
  liveTitle: string
  onNavigate?: () => void
}) {
  const t = useT("essays")
  const router = useRouter()
  const essays = useEssays().data?.items ?? []
  const create = useCreateEssay()
  const { label } = useEssayLabel()
  const open = (id: string) => {
    router.push(`/essays/edit/?id=${encodeURIComponent(id)}`)
    onNavigate?.()
  }
  const add = () => create.mutate({ kind: "other", title: "" }, { onSuccess: (created) => open(created.id) })
  return (
    <nav aria-label={t("editor.rail.title")} className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{t("editor.rail.title")}</h2>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={t("editor.rail.add")}
          disabled={create.isPending}
          onClick={add}
        >
          <Icons.add aria-hidden />
        </Button>
      </div>
      <ul className="flex flex-col gap-1">
        {essays.map((essay) => {
          const active = essay.id === currentId
          return (
            <li key={essay.id}>
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => (active ? undefined : open(essay.id))}
                className={cn(
                  "flex min-h-9 w-full items-center truncate rounded-full px-3 py-1.5 text-left text-sm transition-colors",
                  active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent",
                )}
              >
                <span className="truncate">{label(active ? { ...essay, title: liveTitle } : essay)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
