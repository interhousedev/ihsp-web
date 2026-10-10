"use client";

import type { ArtifactDetail, PublicShare } from "@ihsp/api";
import {
  DataTableViewer,
  FlashcardsViewer,
  InfographicViewer,
  MindMapViewer,
  QuizViewer,
  ReportViewer,
  SharedViewerProvider,
  SlidesViewer,
} from "@ihsp/features-core";
import { StateView } from "@ihsp/ui";

type Shared = NonNullable<PublicShare["artifact"]>;

/** The output the viewers expect, made from the public share: ready, no sources, no saved progress. */
function toArtifact(
  share: PublicShare,
  shared: Shared,
  slug: string,
): ArtifactDetail {
  return {
    id: slug,
    notebook_id: "",
    kind: shared.kind,
    format: null,
    title: share.title,
    status: "ready",
    error: null,
    options: shared.options,
    prompt: null,
    source_count: 0,
    sampled: false,
    unread: false,
    progress: null,
    has_assets: false,
    parent_id: null,
    flashcard_set_id: null,
    created_at: share.created_at,
    finished_at: null,
    content: shared.content,
    refs_index: {},
    source_map: {},
    progress_state: null,
    assets: [],
  } as unknown as ArtifactDetail;
}

function Viewer({ artifact }: { artifact: ArtifactDetail }) {
  switch (artifact.kind) {
    case "report":
      return <ReportViewer notebookId="" artifact={artifact} />;
    case "mind_map":
      return <MindMapViewer notebookId="" artifact={artifact} />;
    case "flashcards":
      return <FlashcardsViewer notebookId="" artifact={artifact} />;
    case "quiz":
      return <QuizViewer notebookId="" artifact={artifact} />;
    case "data_table":
      return <DataTableViewer notebookId="" artifact={artifact} />;
    case "slides":
      return <SlidesViewer notebookId="" artifact={artifact} />;
    case "infographic":
      return <InfographicViewer notebookId="" artifact={artifact} />;
    default:
      return <StateView state="empty" emptyText="" />;
  }
}

/**
 * A shared Studio output, read-only: the notebook viewer of its kind (slides, mind map, report, flash cards, quiz,
 * infographic, table). Nothing is saved: a quiz can be taken and a deck studied, the progress stays in the page.
 */
export function ArtifactView({
  share,
  slug,
}: {
  share: PublicShare;
  slug: string;
}) {
  if (!share.artifact) return null;
  return (
    <div className="bg-card min-w-0 overflow-hidden rounded-xl border">
      <SharedViewerProvider>
        <Viewer artifact={toArtifact(share, share.artifact, slug)} />
      </SharedViewerProvider>
    </div>
  );
}
