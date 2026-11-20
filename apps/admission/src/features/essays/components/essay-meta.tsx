"use client";

import { useT } from "@ihsp/i18n";
import { Badge, Icons, Input, Label, Textarea } from "@ihsp/ui";
import { useState, type ReactNode } from "react";

/** One property of the metadata header: a muted label on the left, the control on the right. */
function PropRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-9 grid-cols-[7rem_minmax(0,1fr)] items-start gap-3 py-1 text-sm">
      <Label
        htmlFor={htmlFor}
        className="text-muted-foreground pt-1.5 text-[13px] font-normal"
      >
        {label}
      </Label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * The properties of an essay above the text: prompt (collapsible), word limit, status and the live word count that
 * turns to the warning colour over the limit. Only fields the essay has.
 */
export function EssayMeta({
  prompt,
  wordLimit,
  words,
  status,
  onPrompt,
  onWordLimit,
  showPrompt = true,
}: {
  prompt: string;
  /** False when the essay answers attached prompts, which are shown above instead. */
  showPrompt?: boolean;
  wordLimit: number | null;
  words: number;
  status: "draft" | "final";
  onPrompt: (value: string) => void;
  onWordLimit: (value: number | null) => void;
}) {
  const t = useT("essays");
  const [open, setOpen] = useState(false);
  const over = wordLimit !== null && words > wordLimit;
  return (
    <div
      className="bg-card border-hairline rounded-card flex flex-col divide-y px-3 py-1"
      data-testid="essay-meta"
    >
      {showPrompt ? (
        <PropRow label={t("promptLabel")} htmlFor="essay-prompt-edit">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="essay-prompt-edit"
            onClick={() => setOpen((v) => !v)}
            className="text-muted-foreground hover:text-foreground flex w-full items-start gap-1.5 py-1 text-left"
          >
            <Icons.chevronRight
              aria-hidden
              className={open ? "mt-0.5 size-4 rotate-90" : "mt-0.5 size-4"}
            />
            <span
              className={
                open ? "sr-only" : "text-foreground line-clamp-2 min-w-0"
              }
            >
              {prompt.trim() || t("promptEmpty")}
            </span>
            <span className="sr-only">
              {open ? t("promptHide") : t("promptShow")}
            </span>
          </button>
          {open ? (
            <Textarea
              id="essay-prompt-edit"
              rows={3}
              value={prompt}
              onChange={(e) => onPrompt(e.target.value)}
            />
          ) : null}
        </PropRow>
      ) : null}
      <PropRow label={t("wordLimit")} htmlFor="essay-limit-edit">
        <Input
          id="essay-limit-edit"
          type="number"
          min={1}
          inputMode="numeric"
          className="h-8 w-28"
          value={wordLimit ?? ""}
          onChange={(e) =>
            onWordLimit(
              e.target.value === "" ? null : Math.floor(Number(e.target.value)),
            )
          }
        />
      </PropRow>
      <PropRow label={t("metaWords")}>
        <span
          data-testid="essay-meta-count"
          className={over ? "text-warning font-medium" : "text-foreground"}
          aria-live="polite"
        >
          {wordLimit
            ? t("metaWordsOf", { count: words, limit: wordLimit })
            : t("words", { count: words })}
        </span>
      </PropRow>
      <PropRow label={t("metaStatus")}>
        <Badge variant={status === "final" ? "success" : "neutral"}>
          {t(`statusValue.${status}`)}
        </Badge>
      </PropRow>
    </div>
  );
}
