"use client"

import {
  deleteLmsCreator,
  getAdminUsersQuery,
  getLmsCreatorsQuery,
  keys,
  putLmsCreator,
  type AdminUser,
  type CourseCreator,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Field,
  FieldLabel,
  Icons,
  Input,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"
import { QueryState } from "../../shared/components/query-state"
import { personName } from "../../shared/utils/people"

/** Only teachers and administrators can become course creators (the backend refuses students with a 422). */
function mayCreate(user: AdminUser): boolean {
  return user.roles.includes("teacher") || user.roles.includes("admin")
}

/**
 * LMS admin: the people who may create courses. Search finds teachers and administrators (the same user search the
 * Administration app uses), the list below holds the current creators with a remove action.
 */
export function CourseCreatorsCard() {
  const t = useT("admin")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const creators = useQuery(getLmsCreatorsQuery({ limit: 100 }))
  const [draft, setDraft] = useState("")
  const [term, setTerm] = useState("")
  const [removing, setRemoving] = useState<CourseCreator | null>(null)
  const found = useQuery({ ...getAdminUsersQuery({ query: term, limit: 20 }), enabled: term !== "" })

  const refresh = () => void queryClient.invalidateQueries({ queryKey: keys.lms.creators() })
  const add = useMutation<CourseCreator, unknown, string>({ mutationFn: (id) => putLmsCreator(id), onSuccess: refresh })
  const remove = useMutation<unknown, unknown, string>({
    mutationFn: (id) => deleteLmsCreator(id),
    onSuccess: () => {
      setRemoving(null)
      refresh()
    },
  })

  const creatorIds = new Set((creators.data?.items ?? []).map((item) => item.id))
  const candidates = (found.data?.items ?? []).filter(mayCreate)

  function search(event: FormEvent) {
    event.preventDefault()
    setTerm(draft.trim())
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{t("creators.title")}</CardTitle>
        <CardDescription>{t("creators.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={search} className="flex flex-col gap-2" role="search">
          <Field>
            <FieldLabel htmlFor="course-creator-search">{t("creators.search")}</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="course-creator-search"
                value={draft}
                autoComplete="off"
                onChange={(event) => setDraft(event.target.value)}
                className="h-11 md:h-8"
              />
              <Button type="submit" variant="outline" disabled={draft.trim() === ""} className="min-h-11 md:min-h-8">
                <Icons.search aria-hidden />
                {t("creators.searchButton")}
              </Button>
            </div>
          </Field>
        </form>
        {add.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(add.error)}</AlertDescription>
          </Alert>
        ) : null}
        {term !== "" && found.data ? (
          candidates.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("creators.noResults")}</p>
          ) : (
            <ul className="flex flex-col gap-2" aria-label={t("creators.results")}>
              {candidates.map((candidate) => (
                <li key={candidate.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm">
                    {personName(candidate)}
                    {candidate.login ? <span className="text-muted-foreground"> · {candidate.login}</span> : null}
                  </span>
                  {creatorIds.has(candidate.id) ? (
                    <Badge variant="secondary">{t("creators.already")}</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={add.isPending}
                      onClick={() => add.mutate(candidate.id)}
                      className="min-h-11 md:min-h-7"
                    >
                      <Icons.add aria-hidden />
                      {t("creators.add")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : null}
        {remove.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(remove.error)}</AlertDescription>
          </Alert>
        ) : null}
        <QueryState query={creators} isEmpty={(page) => page.items.length === 0} emptyText={t("creators.empty")}>
          {(page) => (
            <ul className="flex flex-col gap-2" aria-label={t("creators.list")}>
              {page.items.map((creator) => (
                <li key={creator.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {personName(creator)}
                    {creator.login ? (
                      <span className="text-muted-foreground font-normal"> · {creator.login}</span>
                    ) : null}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRemoving(creator)}
                    className="min-h-11 md:min-h-7"
                  >
                    <Icons.trash aria-hidden />
                    {t("creators.remove")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </QueryState>
        <ConfirmDialog
          open={removing !== null}
          onOpenChange={(open) => !open && setRemoving(null)}
          title={t("creators.removeTitle")}
          description={removing ? t("creators.removeDescription", { name: personName(removing) }) : undefined}
          confirmLabel={t("creators.remove")}
          destructive
          loading={remove.isPending}
          onConfirm={() => {
            if (removing) remove.mutate(removing.id)
          }}
        />
      </CardContent>
    </Card>
  )
}
