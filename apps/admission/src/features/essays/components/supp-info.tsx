"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { useList } from "../../chooser/hooks"
import type { Essay } from "../api"
import { useForkEssay, usePromptMap } from "../flow/api"
import { SuppPrompts } from "./supp-prompts"

/**
 * What the Вузы tab knows about where the essay goes: the prompts it answers (each can be forked into a version for
 * one university), the linked college and that college's own prompts.
 */
export function SuppInfo({ essay }: { essay: Essay }) {
  const t = useT("essays")
  const te = useT("essayEditor")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const entry = useList().data?.find((e) => e.id === essay.list_entry_id)
  const map = usePromptMap()
  const fork = useForkEssay(essay.id)
  const name = entry?.institution.name
  const targets = essay.targets ?? []
  const owners = new Map((map.data?.groups ?? []).flatMap((g) => g.prompts.map((p) => [p.prompt, p.institution_name])))
  return (
    <div className="flex flex-col gap-4">
      {targets.length > 0 ? (
        <section className="flex flex-col gap-2 text-sm">
          <h3 className="text-sm font-semibold">{t("supp.targets")}</h3>
          <ul className="flex flex-col gap-2" data-testid="essay-targets">
            {targets.map((tg) => {
              const owner = owners.get(tg.prompt) ?? t("supp.common")
              return (
                <li
                  key={`${tg.institution_id ?? "common"}-${tg.position}`}
                  className="bg-card border-hairline rounded-card flex flex-col gap-1 border p-3"
                >
                  <span className="font-medium">{owner}</span>
                  <span className="text-muted-foreground">{tg.prompt}</span>
                  {tg.institution_id && targets.length > 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-1 self-start"
                      disabled={fork.isPending}
                      onClick={() =>
                        fork.mutate(
                          { institution_id: tg.institution_id, position: tg.position },
                          { onSuccess: (made) => router.push(`/essays/edit/?id=${encodeURIComponent(made.essay.id)}`) },
                        )
                      }
                    >
                      {te("fork", { name: owner })}
                    </Button>
                  ) : null}
                </li>
              )
            })}
          </ul>
          {fork.isError ? (
            <p role="alert" className="text-destructive text-xs">
              {errorMessage(fork.error)}
            </p>
          ) : null}
        </section>
      ) : null}
      {name ? (
        <Link
          href={`/chooser/?step=list&entry=${encodeURIComponent(essay.list_entry_id ?? "")}`}
          className="flex items-center gap-2 text-sm"
        >
          <LogoAvatar
            name={name}
            src={entry?.institution.logo_url}
            fit={entry?.institution.logo_fit}
            zoom={entry?.institution.logo_zoom}
            className="size-6"
          />
          {name}
          <Icons.chevronRight aria-hidden className="text-muted-foreground size-4" />
        </Link>
      ) : targets.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("supp.noCollege")}</p>
      ) : null}
      {entry && name ? (
        <SuppPrompts
          institutionId={entry.institution.id}
          listEntryId={entry.id}
          college={name}
          websiteUrl={entry.institution.website_url}
        />
      ) : null}
    </div>
  )
}
