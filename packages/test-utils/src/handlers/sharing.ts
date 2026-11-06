import type { FileShares, LinkedSet, NotebookShares, SharedFile, SharedNotebook } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, noContent, notFound, param, query, readJson } from "./utils"

/** In-memory sharing state of one test. */
export const sharingState = {
  notebook: { link_active: false, people: [], hidden_source_kinds: [] } as NotebookShares,
  file: { link_active: false, people: [] } as FileShares,
  sharedNotebooks: [] as SharedNotebook[],
  sharedFiles: [] as SharedFile[],
  linkedSets: [] as LinkedSet[],
  /** The only token the mocked backend accepts. */
  validToken: "good-token",
}

export function resetSharing(): void {
  sharingState.notebook = { link_active: false, people: [], hidden_source_kinds: [] }
  sharingState.file = { link_active: false, people: [] }
  sharingState.sharedNotebooks = []
  sharingState.sharedFiles = []
  sharingState.linkedSets = []
}

const person = (id: string) => ({
  user_id: id,
  name: "Dilnoza Karimova",
  via: "direct" as const,
  created_at: "2026-11-05T09:00:00Z",
})

export const sharingHandlers = [
  http.get(apiUrl("/v1/notebooks/shared"), () => HttpResponse.json({ items: sharingState.sharedNotebooks })),
  http.get(apiUrl("/v1/notebooks/share-recipients"), ({ request }) => {
    const q = query(request).get("q") ?? ""
    return HttpResponse.json({
      items: "dilnoza".includes(q.toLowerCase()) ? [{ id: "user-dilnoza", name: "Dilnoza Karimova" }] : [],
    })
  }),
  http.post(apiUrl("/v1/notebooks/shares/join"), async ({ request }) => {
    const body = await readJson<{ token: string }>(request)
    return body.token === sharingState.validToken ? HttpResponse.json({ id: "nb-shared" }) : notFound("Notebook")
  }),
  http.get(apiUrl("/v1/notebooks/:id/shares"), () => HttpResponse.json(sharingState.notebook)),
  http.post(apiUrl("/v1/notebooks/:id/shares/link"), () => {
    sharingState.notebook.link_active = true
    return HttpResponse.json({ token: "new-token" })
  }),
  http.delete(apiUrl("/v1/notebooks/:id/shares/link"), () => {
    sharingState.notebook.link_active = false
    return noContent()
  }),
  http.put(apiUrl("/v1/notebooks/:id/shares/:user"), ({ params }) => {
    sharingState.notebook.people.push(person(param(params, "user")))
    return noContent()
  }),
  http.delete(apiUrl("/v1/notebooks/:id/shares/:user"), ({ params }) => {
    const user = param(params, "user")
    sharingState.notebook.people = sharingState.notebook.people.filter((p) => p.user_id !== user)
    return noContent()
  }),
  http.delete(apiUrl("/v1/notebooks/:id/membership"), () => noContent()),
  http.post(apiUrl("/v1/notebooks/:id/copy"), () => HttpResponse.json({ id: "nb-copy" }, { status: 201 })),
  http.get(apiUrl("/v1/notebooks/:id/linked-sets"), () => HttpResponse.json({ items: sharingState.linkedSets })),
  http.post(apiUrl("/v1/notebooks/:id/linked-sets"), () => new HttpResponse(null, { status: 201 })),
  http.delete(apiUrl("/v1/notebooks/:id/linked-sets/:linked"), () => noContent()),
  http.get(apiUrl("/v1/me/shared-files"), () => HttpResponse.json({ items: sharingState.sharedFiles })),
  http.get(apiUrl("/v1/files/shared/:id/url"), () =>
    HttpResponse.json({ url: "https://storage.test/shared", expires_at: "2026-11-05T09:01:00Z" }),
  ),
  http.delete(apiUrl("/v1/files/shared/:id"), () => noContent()),
  http.post(apiUrl("/v1/files/shares/join"), async ({ request }) => {
    const body = await readJson<{ token: string }>(request)
    return body.token === sharingState.validToken ? HttpResponse.json({ id: "file-shared" }) : notFound("File")
  }),
  http.get(apiUrl("/v1/files/:id/shares"), () => HttpResponse.json(sharingState.file)),
  http.post(apiUrl("/v1/files/:id/shares/link"), () => {
    sharingState.file.link_active = true
    return HttpResponse.json({ token: "new-token" })
  }),
  http.delete(apiUrl("/v1/files/:id/shares/link"), () => {
    sharingState.file.link_active = false
    return noContent()
  }),
  http.put(apiUrl("/v1/files/:id/shares/:user"), ({ params }) => {
    sharingState.file.people.push(person(param(params, "user")))
    return noContent()
  }),
  http.delete(apiUrl("/v1/files/:id/shares/:user"), ({ params }) => {
    const user = param(params, "user")
    sharingState.file.people = sharingState.file.people.filter((p) => p.user_id !== user)
    return noContent()
  }),
]
