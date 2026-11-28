"use client";

import { useErrorMessage, useT } from "@ihsp/i18n";
import { Button, buttonVariants, Icons, PageContainer, Switch } from "@ihsp/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useEvent } from "../use-activities";
import {
  useAlbumActions,
  useAlbumMedia,
  useEventAlbum,
  useEventEdit,
} from "../use-club-media";
import {
  MediaGrid,
  MediaLightbox,
  MediaUploadButton,
  ReportMediaDialog,
} from "./club-media";

/** Event album (`/activities/album/?event=<id>`): photos and videos, lightbox, report; organizers upload and curate. */
export function AlbumPage() {
  const t = useT("clubMedia");
  const common = useT("common");
  const errorMessage = useErrorMessage();
  const eventId = useSearchParams().get("event");
  const event = useEvent(eventId);
  const album = useEventAlbum(eventId);
  const a = album.data ?? null;
  const media = useAlbumMedia(a?.id ?? null);
  const actions = useAlbumActions(eventId ?? "", a?.id ?? null);
  const { setCover } = useEventEdit(eventId ?? "");
  const [open, setOpen] = useState<number | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);
  const items = (media.data?.pages ?? []).flatMap((p) => p.items);
  const m = open == null ? null : items[open];
  const e = event.data;
  const back = (
    <Link
      href={eventId ? `/activities/event/?id=${eventId}` : "/activities/"}
      className={buttonVariants({ variant: "ghost", size: "sm" })}
    >
      <Icons.chevronLeft data-icon="inline-start" aria-hidden />
      {t("backToEvent")}
    </Link>
  );
  if (event.isPending || album.isPending)
    return (
      <PageContainer title={common("loading")} back={back}>
        {null}
      </PageContainer>
    );
  const failure = event.error ?? album.error ?? media.error;
  const mutationError =
    actions.upload.error ??
    actions.remove.error ??
    actions.setMemberUploads.error ??
    setCover.error ??
    null;
  return (
    <PageContainer
      title={e ? t("titleOf", { title: e.title }) : t("title")}
      back={back}
    >
      {failure ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(failure)}
        </p>
      ) : null}
      {mutationError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(mutationError)}
        </p>
      ) : null}
      {!a ? (
        <p className="text-muted-foreground text-sm">{t("noAlbum")}</p>
      ) : (
        <div className="grid gap-4">
          {a.can_upload && e ? (
            <MediaUploadButton
              pending={actions.upload.isPending}
              onFiles={(files, consentAttested) =>
                actions.upload.mutate({
                  clubId: e.club_id,
                  files,
                  consentAttested,
                })
              }
            />
          ) : null}
          {a.can_moderate ? (
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={a.member_uploads}
                disabled={actions.setMemberUploads.isPending}
                onCheckedChange={(v) => actions.setMemberUploads.mutate(v)}
              />
              {t("memberUploads")}
            </label>
          ) : null}
          {items.length === 0 && !media.isPending ? (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          ) : (
            <MediaGrid items={items} onOpen={setOpen} />
          )}
          {media.hasNextPage ? (
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={media.isFetchingNextPage}
              onClick={() => media.fetchNextPage()}
            >
              {t("more")}
            </Button>
          ) : null}
        </div>
      )}
      <MediaLightbox
        items={items}
        index={open}
        onIndex={setOpen}
        onClose={() => setOpen(null)}
        actions={
          m ? (
            <>
              {a?.can_moderate && m.kind === "photo" && e ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={setCover.isPending || e.cover_media_id === m.id}
                  onClick={() => setCover.mutate(m.id)}
                >
                  {e.cover_media_id === m.id ? t("isCover") : t("setCover")}
                </Button>
              ) : null}
              {m.can_delete ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={actions.remove.isPending}
                  onClick={() =>
                    actions.remove.mutate(m.id, {
                      onSuccess: () => setOpen(null),
                    })
                  }
                >
                  <Icons.trash data-icon="inline-start" aria-hidden />
                  {t("delete")}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setReporting(m.id)}
                >
                  <Icons.flag data-icon="inline-start" aria-hidden />
                  {t("report.action")}
                </Button>
              )}
            </>
          ) : null
        }
      />
      <ReportMediaDialog
        key={reporting ?? "none"}
        open={reporting != null}
        onOpenChange={(v) => (v ? null : setReporting(null))}
        pending={actions.report.isPending}
        error={actions.report.error}
        onSubmit={(reason, isSubject) =>
          reporting &&
          actions.report.mutate(
            { id: reporting, reason, isSubject },
            {
              onSuccess: () => {
                setReporting(null);
                setOpen(null);
              },
            },
          )
        }
      />
    </PageContainer>
  );
}
