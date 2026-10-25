// The components other tasks own, in one place: the workspace imports them only from here, so a test can replace the
// whole set with `mock.module("./panes", ...)` without touching the modules those tasks test.
//
// Each pane is a thin wrapper that is defined here. A plain re-export would not do: when the real module is already
// loaded (an earlier test file rendered the workspace), Bun's `mock.module` rewrites the binding the re-export points
// at, and the stand-ins would replace the real components for every test file that runs afterwards.
import { createElement, type ComponentProps } from "react"
import {
  AddSourcesDialog as AddSourcesDialogImpl,
  NoteEditor as NoteEditorImpl,
  SourceViewer as SourceViewerImpl,
  SourcesPanel as SourcesPanelImpl,
} from "../sources"
import { ChatConfigDialog as ChatConfigDialogImpl, NotebookChat as NotebookChatImpl } from "../chat"
import { StudioPanel as StudioPanelImpl, UsageDialog as UsageDialogImpl } from "../studio"
import { ArtifactViewer as ArtifactViewerImpl } from "../viewers"

export function AddSourcesDialog(props: ComponentProps<typeof AddSourcesDialogImpl>) {
  return createElement(AddSourcesDialogImpl, props)
}

export function NoteEditor(props: ComponentProps<typeof NoteEditorImpl>) {
  return createElement(NoteEditorImpl, props)
}

export function SourceViewer(props: ComponentProps<typeof SourceViewerImpl>) {
  return createElement(SourceViewerImpl, props)
}

export function SourcesPanel(props: ComponentProps<typeof SourcesPanelImpl>) {
  return createElement(SourcesPanelImpl, props)
}

export function ChatConfigDialog(props: ComponentProps<typeof ChatConfigDialogImpl>) {
  return createElement(ChatConfigDialogImpl, props)
}

export function NotebookChat(props: ComponentProps<typeof NotebookChatImpl>) {
  return createElement(NotebookChatImpl, props)
}

export function StudioPanel(props: ComponentProps<typeof StudioPanelImpl>) {
  return createElement(StudioPanelImpl, props)
}

export function UsageDialog(props: ComponentProps<typeof UsageDialogImpl>) {
  return createElement(UsageDialogImpl, props)
}

export function ArtifactViewer(props: ComponentProps<typeof ArtifactViewerImpl>) {
  return createElement(ArtifactViewerImpl, props)
}
