"use client";

import { useState } from "react";

const EMPTY: readonly never[] = [];

/**
 * Keeps the first non-empty list it sees. "New marks" disappear from the server's answer once the visit is recorded,
 * but they should stay on screen until the student leaves the page.
 */
export function useStickyList<T>(list: readonly T[] | undefined): readonly T[] {
  const [kept, setKept] = useState<readonly T[]>(EMPTY);
  if (kept.length === 0 && list && list.length > 0) setKept(list);
  return kept.length > 0 ? kept : EMPTY;
}
