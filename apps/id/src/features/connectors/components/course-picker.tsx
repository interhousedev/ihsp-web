"use client"

import { listMyManagedCourses } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { CheckboxRow } from "../../shared/components/checkbox-row"
import { useTr } from "../../shared/hooks/use-tr"

type CoursePickerProps = { selected: string[]; onChange: (ids: string[]) => void }

/** UF-MCP-01 step 3: limit an LMS connector to some of the courses the user manages (none ticked = all of them). */
export function CoursePicker({ selected, onChange }: CoursePickerProps) {
  const t = useTr()
  const courses = useQuery({ queryKey: ["lms", "my-courses", "managed"], queryFn: () => listMyManagedCourses() })

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">{t("connectors.new.courses")}</legend>
      <p className="text-muted-foreground text-sm">{t("connectors.new.coursesHint")}</p>
      {courses.isPending ? <p className="text-muted-foreground text-sm">{t("idCommon.loading")}</p> : null}
      {courses.isError ? <p className="text-destructive text-sm">{t("connectors.new.coursesFailed")}</p> : null}
      {(courses.data ?? []).map((course) => (
        <CheckboxRow
          key={course.id}
          ariaLabel={course.title}
          checked={selected.includes(course.id)}
          onCheckedChange={(checked) =>
            onChange(checked ? [...selected, course.id] : selected.filter((id) => id !== course.id))
          }
        >
          <span className="text-sm">{course.title}</span>
        </CheckboxRow>
      ))}
    </fieldset>
  )
}
