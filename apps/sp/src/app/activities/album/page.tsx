"use client";

import { AlbumPage } from "@/features/activities/components/album-page";
import { SpShell } from "@/features/shell/components/sp-shell";
import { Suspense } from "react";

export default function AlbumPageRoute() {
  return (
    <SpShell>
      <Suspense>
        <AlbumPage />
      </Suspense>
    </SpShell>
  );
}
