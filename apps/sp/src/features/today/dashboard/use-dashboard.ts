"use client";

import { getMeDashboardQuery, keys, putMeDashboard } from "@ihsp/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toSaveBody, type Widget } from "./model";

export function useDashboard() {
  return useQuery(getMeDashboardQuery());
}

/** Saves the edited widgets with the version they were read at; the answer replaces the cached layout. */
export function useSaveDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      version,
      widgets,
    }: {
      version: number;
      widgets: readonly Widget[];
    }) => putMeDashboard(toSaveBody(version, widgets)),
    onSuccess: (saved) =>
      queryClient.setQueryData(keys.dashboard.layout(), saved),
    // 409: someone saved elsewhere; read the stored layout again so the next edit starts from it.
    onError: () =>
      queryClient.invalidateQueries({ queryKey: keys.dashboard.layout() }),
  });
}
