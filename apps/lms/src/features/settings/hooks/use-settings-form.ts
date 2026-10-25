"use client"

import {
  ApiError,
  getLmsCourseSettings,
  getLmsCourseSettingsQuery,
  lmsSettingsKey,
  patchLmsCourseDetails,
  type CourseSettingsView,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { changedFields, validateSettings, type SettingsErrors } from "../utils/validate"

/** Editable copy of the course settings: validation, the list of changed fields and the save call. */
export function useSettingsForm(courseId: string) {
  const queryClient = useQueryClient()
  const query = useQuery(getLmsCourseSettingsQuery(courseId))
  const base = query.data
  const [values, setValues] = useState<CourseSettingsView | null>(null)
  const [serverError, setServerError] = useState<{ field: string; reason: string } | null>(null)

  // Take the server copy on load and after every save; local edits live in `values` until then.
  useEffect(() => {
    if (base && values === null) setValues(structuredClone(base))
  }, [base, values])

  const errors: SettingsErrors = useMemo(() => (values ? validateSettings(values) : {}), [values])
  const body = useMemo(() => (base && values ? changedFields(base, values) : {}), [base, values])
  const dirty = Object.keys(body).length > 0

  const save = useMutation<CourseSettingsView, unknown, void>({
    mutationFn: () => patchLmsCourseDetails(courseId, body),
    onSuccess: (view) => {
      setServerError(null)
      queryClient.setQueryData(lmsSettingsKey(courseId), view)
      setValues(structuredClone(view))
    },
    onError: (error) => {
      if (error instanceof ApiError && error.type === "lms/settings-invalid") {
        setServerError({ field: String(error.params.field ?? ""), reason: String(error.params.reason ?? "") })
      }
    },
  })

  function update(patch: Partial<CourseSettingsView>) {
    setValues((current) => (current ? { ...current, ...patch } : current))
  }

  /** Reads the server state fields that actions (archive, join code) change, without touching unsaved edits. */
  async function refreshState() {
    const fresh = await getLmsCourseSettings(courseId)
    queryClient.setQueryData(lmsSettingsKey(courseId), (old: CourseSettingsView | undefined) =>
      old
        ? { ...old, publish_state: fresh.publish_state, visibility: fresh.visibility, invite_code: fresh.invite_code }
        : fresh,
    )
    update({ publish_state: fresh.publish_state, visibility: fresh.visibility, invite_code: fresh.invite_code })
  }

  return {
    query,
    values,
    update,
    errors,
    dirty,
    save,
    serverError,
    invalid: Object.keys(errors).length > 0,
    refreshState,
  }
}
export type SettingsForm = ReturnType<typeof useSettingsForm>
