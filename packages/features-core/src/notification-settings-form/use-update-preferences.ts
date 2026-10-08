"use client"

import { keys, patchPreferences, type UserMe, type UserPreferences, type UserPreferencesPatch } from "@ihsp/api"
import { getSession, useAuthStore } from "@ihsp/auth"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/** Writes the changed preferences into the in-memory session (and the cached `GET /v1/id/me`), so every screen sees them at once. */
export function applyPreferences(changed: Partial<UserPreferences>, queryClient: ReturnType<typeof useQueryClient>) {
  const session = getSession()
  if (session)
    useAuthStore.getState().setUser({ ...session.user, preferences: { ...session.user.preferences, ...changed } })
  queryClient.setQueryData<UserMe>(keys.id.me(), (current) =>
    current ? { ...current, preferences: { ...current.preferences, ...changed } } : current,
  )
}

/**
 * `PATCH /v1/id/me/preferences` with an optimistic update: the change shows at once and is rolled back when the
 * request fails. Several quick changes are fine (the server merges partial updates).
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  return useMutation<UserPreferences, unknown, UserPreferencesPatch, { previous: UserPreferences | null }>({
    mutationFn: (patch) => patchPreferences(patch),
    onMutate: (patch) => {
      const previous = getSession()?.user.preferences ?? null
      if (previous) applyPreferences({ ...previous, ...patch }, queryClient)
      return { previous }
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) applyPreferences(context.previous, queryClient)
    },
    onSuccess: (preferences) => applyPreferences(preferences, queryClient),
  })
}

/** The current preferences of the logged-in user (`null` before the session is loaded). */
export function usePreferences(): UserPreferences | null {
  return useAuthStore((state) => state.user?.preferences ?? null)
}
