"use client"

import { isApiError, keys, postLmsJoin, type CoursePage } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  Field,
  FieldLabel,
  Input,
  PageContainer,
  Spinner,
} from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"
import { StepikScope } from "../../shared/components/stepik-scope"
import { hrefs } from "../../shared/utils/hrefs"

/** `/join/?code=`: joins an invite-only course by code (UF-LMS-02). The code from the link only pre-fills the field. */
export function JoinPage() {
  const t = useT("join")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const queryClient = useQueryClient()
  const initial = useSearchParams().get("code")
  const [code, setCode] = useState(initial ?? "")

  const join = useMutation<CoursePage, unknown, string>({
    mutationFn: (value) => postLmsJoin({ code: value }),
    onSuccess: (page) => {
      queryClient.setQueryData(keys.lms.course(page.slug), page)
      void queryClient.invalidateQueries({ queryKey: keys.lms.myCourses() })
      router.push(hrefs.course(page.slug))
    },
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    const value = code.trim()
    if (value) join.mutate(value)
  }

  const invalid = isApiError(join.error) && (join.error.type === "lms/invite-not-valid" || join.error.status === 404)

  return (
    <StepikScope>
      <PageContainer title={t("title")} description={t("description")}>
        <Card className="max-w-md">
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
              <Field>
                <FieldLabel htmlFor="join-code">{t("codeLabel")}</FieldLabel>
                <Input
                  id="join-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="h-11 font-mono tracking-widest md:h-8"
                />
              </Field>
              {join.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>{invalid ? t("invalid") : errorMessage(join.error)}</AlertDescription>
                </Alert>
              ) : null}
              <Button type="submit" disabled={join.isPending || code.trim() === ""} className="min-h-11 md:min-h-8">
                {join.isPending ? <Spinner aria-hidden /> : null}
                {t("submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </PageContainer>
    </StepikScope>
  )
}
