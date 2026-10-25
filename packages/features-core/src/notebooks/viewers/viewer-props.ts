import type { ArtifactDetail, ArtifactKind } from "@ihsp/api"

/**
 * Props of every artifact viewer. The viewer renders the content only; `ArtifactViewer` renders the header (Back,
 * title, item menu), the "large notebook" banner and the loading and error states around it. Viewers talk to the
 * rest of the workspace through `useWorkspace()` (ask the chat, open a source).
 */
export type ViewerProps<K extends ArtifactKind> = {
  notebookId: string
  artifact: Extract<ArtifactDetail, { kind: K }>
}
