"use client"

import {
  deleteAiProject,
  deleteAiProjectFile,
  getAiChatsQuery,
  getAiProjectFilesQuery,
  getAiProjectQuery,
  getAiProjectsQuery,
  keys,
  patchAiProject,
  postAiProject,
  postAiProjectFile,
  type ProjectBody,
  type ProjectResponse,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const PROJECT_CHATS_LIMIT = 100

/** The student's projects, newest first as the server sends them. */
export function useProjects() {
  return useQuery(getAiProjectsQuery())
}

export function useProject(id: string) {
  return useQuery({ ...getAiProjectQuery(id), enabled: id !== "" })
}

export function useProjectFiles(id: string) {
  return useQuery({ ...getAiProjectFilesQuery(id), enabled: id !== "" })
}

/** The chats that belong to a project (`GET /ai/chats?project_id=`), the Chats tab and the sidebar. */
export function useProjectChats(id: string, enabled = true) {
  return useQuery({
    ...getAiChatsQuery({ assistant: "student", project_id: id, limit: PROJECT_CHATS_LIMIT }),
    enabled: enabled && id !== "",
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation<ProjectResponse, unknown, ProjectBody>({
    mutationFn: (body) => postAiProject(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.ai.projects() }),
  })
}

export function useRenameProject(id: string) {
  const queryClient = useQueryClient()
  return useMutation<ProjectResponse, unknown, string>({
    mutationFn: (name) => patchAiProject(id, { name }),
    onSuccess: (project) => {
      queryClient.setQueryData(keys.ai.project(id), project)
      return queryClient.invalidateQueries({ queryKey: keys.ai.projects() })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation<void, unknown, string>({
    mutationFn: (id) => deleteAiProject(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: keys.ai.project(id) })
      return queryClient.invalidateQueries({ queryKey: keys.ai.projects() })
    },
  })
}

/** Attaches the given ready files to a project one after another; the list refreshes once at the end. */
export function useAttachProjectFiles(id: string) {
  const queryClient = useQueryClient()
  return useMutation<void, unknown, string[]>({
    mutationFn: async (fileIds) => {
      for (const fileId of fileIds) await postAiProjectFile(id, { file_id: fileId })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.ai.projectFiles(id) }),
  })
}

export function useDetachProjectFile(id: string) {
  const queryClient = useQueryClient()
  return useMutation<void, unknown, string>({
    mutationFn: (fileId) => deleteAiProjectFile(id, fileId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.ai.projectFiles(id) }),
  })
}
