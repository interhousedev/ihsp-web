"use client"

import {
  deleteArtifact,
  getArtifactQuery,
  getArtifactsQuery,
  keys,
  patchArtifact,
  postArtifact,
  postArtifactAsSource,
  postArtifactCancel,
  postArtifactFlashcardSet,
  postArtifactRetry,
  postArtifactSlidesRevise,
  putArtifactProgress,
  putArtifactSlides,
  type ArtifactCreate,
  type ArtifactDetail,
  type ArtifactItem,
  type FlashcardSetResult,
  type Slide,
  type SlidesReviseBody,
  type SourceItem,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { isActive } from "../lib/artifact-kinds"

const POLL_MS = 3000

/** The Studio list (newest first, no content); polls every 3 s while anything is `queued` or `generating`. */
export function useArtifacts(notebookId: string) {
  return useQuery({
    ...getArtifactsQuery(notebookId),
    refetchInterval: (query) => ((query.state.data ?? []).some(isActive) ? POLL_MS : false),
  })
}

/** One artifact with its content; the server marks it viewed. */
export function useArtifact(notebookId: string, artifactId: string | null) {
  return useQuery({
    ...getArtifactQuery(notebookId, artifactId ?? ""),
    enabled: artifactId !== null && artifactId !== "",
  })
}

function setListCache(queryClient: QueryClient, notebookId: string, update: (items: ArtifactItem[]) => ArtifactItem[]) {
  queryClient.setQueryData<ArtifactItem[]>(keys.notebooks.artifacts(notebookId), (current) =>
    current ? update(current) : current,
  )
}

function refreshList(queryClient: QueryClient, notebookId: string) {
  void queryClient.invalidateQueries({ queryKey: keys.notebooks.artifacts(notebookId) })
  void queryClient.invalidateQueries({ queryKey: keys.notebooks.usage() })
}

/** Starts a generation (`202`); the new item shows `queued` at the top of the list at once. */
export function useCreateArtifact(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<ArtifactItem, unknown, ArtifactCreate>({
    mutationFn: (body) => postArtifact(notebookId, body),
    onSuccess: (item) => {
      setListCache(queryClient, notebookId, (items) => [item, ...items.filter((current) => current.id !== item.id)])
      refreshList(queryClient, notebookId)
    },
    onError: () => void queryClient.invalidateQueries({ queryKey: keys.notebooks.usage() }),
  })
}

export function useRenameArtifact(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<ArtifactItem, unknown, { id: string; title: string }>({
    mutationFn: ({ id, title }) => patchArtifact(notebookId, id, { title }),
    onSuccess: (item) => {
      setListCache(queryClient, notebookId, (items) =>
        items.map((current) => (current.id === item.id ? item : current)),
      )
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.artifact(notebookId, item.id) })
    },
  })
}

export function useDeleteArtifact(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<unknown, unknown, string>({
    mutationFn: (id) => deleteArtifact(notebookId, id),
    onSuccess: (_result, id) => {
      setListCache(queryClient, notebookId, (items) => items.filter((item) => item.id !== id))
      queryClient.removeQueries({ queryKey: keys.notebooks.artifact(notebookId, id) })
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.usage() })
    },
  })
}

export function useCancelArtifact(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<ArtifactItem, unknown, string>({
    mutationFn: (id) => postArtifactCancel(notebookId, id),
    onSuccess: () => refreshList(queryClient, notebookId),
  })
}

/** "Try again" on a failed item. */
export function useRetryArtifact(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<ArtifactItem, unknown, string>({
    mutationFn: (id) => postArtifactRetry(notebookId, id),
    onSuccess: (item) => {
      setListCache(queryClient, notebookId, (items) =>
        items.map((current) => (current.id === item.id ? item : current)),
      )
      refreshList(queryClient, notebookId)
    },
  })
}

/** Flash cards and quiz progress (at most 16 KB). The viewer debounces the calls. */
export function useSaveProgress(notebookId: string, artifactId: string) {
  return useMutation<unknown, unknown, Record<string, unknown>>({
    mutationFn: (state) => putArtifactProgress(notebookId, artifactId, { state }),
  })
}

/** "Add as source" of a report: creates a note source from it. */
export function useSaveArtifactAsSource(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<SourceItem, unknown, string>({
    mutationFn: (id) => postArtifactAsSource(notebookId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.sources(notebookId) })
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.detail(notebookId) })
    },
  })
}

/** "Save as flash card set": idempotent; afterwards the artifact has `flashcard_set_id`. */
export function useSaveFlashcardSet(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<FlashcardSetResult, unknown, string>({
    mutationFn: (id) => postArtifactFlashcardSet(notebookId, id),
    onSuccess: (result, id) => {
      setListCache(queryClient, notebookId, (items) =>
        items.map((item) => (item.id === id ? { ...item, flashcard_set_id: result.set_id } : item)),
      )
      queryClient.setQueryData<ArtifactDetail>(keys.notebooks.artifact(notebookId, id), (current) =>
        current ? { ...current, flashcard_set_id: result.set_id } : current,
      )
      void queryClient.invalidateQueries({ queryKey: keys.flashcards.sets() })
    },
  })
}

/** Slides editor: save the edited, reordered or reduced list of slides (P2). */
export function useUpdateSlides(notebookId: string, artifactId: string) {
  const queryClient = useQueryClient()
  return useMutation<ArtifactDetail, unknown, Slide[]>({
    mutationFn: (slides) => putArtifactSlides(notebookId, artifactId, { slides }),
    onSuccess: (detail) => queryClient.setQueryData(keys.notebooks.artifact(notebookId, artifactId), detail),
  })
}

/** Slides "Generate revised deck": creates a new artifact with `parent_id` set (P2). */
export function useReviseSlides(notebookId: string, artifactId: string) {
  const queryClient = useQueryClient()
  return useMutation<ArtifactItem, unknown, SlidesReviseBody>({
    mutationFn: (body) => postArtifactSlidesRevise(notebookId, artifactId, body),
    onSuccess: (item) => {
      setListCache(queryClient, notebookId, (items) => [item, ...items])
      refreshList(queryClient, notebookId)
    },
  })
}
