"use client"

import { clientConfigQuery, type ClientConfig } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

/** The public client config; `undefined` while loading or when the request failed, so callers treat that as "off". */
export function useClientConfig(): ClientConfig | undefined {
  return useQuery(clientConfigQuery()).data
}
