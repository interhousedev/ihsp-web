"use client";

import type { ReportContent } from "@ihsp/api";
import { cn, useIsMobile } from "@ihsp/ui";
import { useId, useRef } from "react";
import { CitedMarkdown } from "../chat/cited-markdown";
import { AskSelectionButton } from "./report/ask-selection-button";
import { useHeadingAnchors } from "./report/heading-anchors";
import { ReportContents } from "./report/report-contents";
import { ReportToolbar } from "./report/report-toolbar";
import { useTextSelection } from "./report/use-text-selection";
import { useSharedViewer } from "./shared-viewer";
import { useNarrow } from "./use-narrow";
import { ViewerEmpty } from "./viewer-empty";
import type { ViewerProps } from "./viewer-props";

/** Below this width of the pane the table of contents folds into a collapsible list above the text. */
const WIDE_PANE_PX = 720;

/**
 * A report (conspect, study guide, briefing, ...): Markdown with citation chips, a table of contents, a toolbar (Copy,
 * Download .md, Print / PDF, Add as source) and "Ask about this" for selected text (docs/reference/notebooklm.md § 3.4.1).
 */
export function ReportViewer({ notebookId, artifact }: ViewerProps<"report">) {
  const content = artifact.content;
  if (!content) return <ViewerEmpty />;
  return (
    <ReportBody notebookId={notebookId} artifact={artifact} content={content} />
  );
}

function ReportBody({
  notebookId,
  artifact,
  content,
}: ViewerProps<"report"> & {
  content: ReportContent;
}) {
  const isMobile = useIsMobile();
  const frame = useRef<HTMLDivElement>(null);
  const article = useRef<HTMLElement>(null);
  const narrow = useNarrow(frame, WIDE_PANE_PX);
  const prefix = `report-${useId()}-`;
  useHeadingAnchors(article, content.headings, prefix);
  const selection = useTextSelection(article);
  const shared = useSharedViewer();
  const collapsible = isMobile || narrow;

  return (
    <div
      ref={frame}
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 md:p-6 print:block print:max-w-none print:p-0",
        !collapsible && "flex-row items-start gap-8",
      )}
    >
      {content.headings.length > 0 ? (
        <ReportContents
          headings={content.headings}
          prefix={prefix}
          collapsible={collapsible}
        />
      ) : null}
      <div className="min-w-0 flex-1 print:block">
        <ReportToolbar
          notebookId={notebookId}
          artifact={artifact}
          content={content}
        />
        <article
          ref={article}
          aria-label={content.title}
          className="max-w-[72ch] print:max-w-none"
        >
          <CitedMarkdown
            text={content.markdown}
            citations={content.citations}
            className="text-base"
          />
        </article>
        {shared ? null : <AskSelectionButton selection={selection} />}
      </div>
    </div>
  );
}
