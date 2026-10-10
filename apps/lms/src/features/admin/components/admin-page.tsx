"use client"

import { postLmsCourses, type CourseDraft } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  NativeSelect,
  NativeSelectOption,
  PageContainer,
  Spinner,
} from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { hrefs } from "../../shared/utils/hrefs"
import { courseFormSchema, slugify, type CourseFormValues } from "../utils/slugify"
import { CourseCreatorsCard } from "./course-creators-card"

/**
 * `/admin/`: an LMS admin or a course creator creates a course (UF-LMS-06 step 1): title, address and visibility; the draft
 * starts empty and a creator becomes its owner. LMS admins also manage the course creators here.
 */
export function AdminPage() {
  const t = useT("admin")
  const { session } = useSession()
  const isLmsAdmin = session?.user.roles.includes("lms_admin") ?? false
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [visibility, setVisibility] = useState<CourseFormValues["visibility"]>("public")
  const [submitted, setSubmitted] = useState(false)

  const create = useMutation<CourseDraft, unknown, CourseFormValues>({
    mutationFn: (body) => postLmsCourses(body),
    onSuccess: (draft) => router.push(hrefs.edit(draft.id)),
  })

  const parsed = courseFormSchema.safeParse({ title, slug, visibility })
  const titleInvalid = submitted && title.trim() === ""
  const slugInvalid = submitted && !courseFormSchema.shape.slug.safeParse(slug).success

  function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (parsed.success) create.mutate(parsed.data)
  }

  return (
    <PageContainer title={t("title")}>
      <Card className="max-w-lg">
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <Field>
              <FieldLabel htmlFor="course-new-title">{t("courseTitle")}</FieldLabel>
              <Input
                id="course-new-title"
                value={title}
                aria-invalid={titleInvalid}
                maxLength={200}
                onChange={(event) => {
                  setTitle(event.target.value)
                  if (!slugTouched) setSlug(slugify(event.target.value))
                }}
                className="h-11 md:h-8"
              />
              {titleInvalid ? <FieldError>{t("titleRequired")}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="course-new-slug">{t("slug")}</FieldLabel>
              <Input
                id="course-new-slug"
                value={slug}
                aria-invalid={slugInvalid}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => {
                  setSlugTouched(true)
                  setSlug(event.target.value)
                }}
                className="h-11 font-mono md:h-8"
              />
              <FieldDescription>{t("slugHint")}</FieldDescription>
              {slugInvalid ? <FieldError>{t("slugInvalid")}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="course-new-visibility">{t("visibility")}</FieldLabel>
              <NativeSelect
                id="course-new-visibility"
                value={visibility}
                onChange={(event) => setVisibility(event.target.value === "invite" ? "invite" : "public")}
                className="w-full"
              >
                <NativeSelectOption value="public">{t("visibilityPublic")}</NativeSelectOption>
                <NativeSelectOption value="invite">{t("visibilityInvite")}</NativeSelectOption>
              </NativeSelect>
              <FieldDescription>{visibility === "public" ? t("publicHint") : t("inviteHint")}</FieldDescription>
            </Field>
            {create.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage(create.error)}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" disabled={create.isPending} className="min-h-11 md:min-h-8">
              {create.isPending ? <Spinner aria-hidden /> : null}
              {t("create")}
            </Button>
          </form>
        </CardContent>
      </Card>
      {isLmsAdmin ? <CourseCreatorsCard /> : null}
    </PageContainer>
  )
}
