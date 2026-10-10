import type { Messages } from "@ihsp/i18n"
import catalog from "./catalog.json"
import manage from "./manage.json"
import reader from "./reader.json"
import upload from "./upload.json"

/**
 * Each area file owns distinct top-level keys (a test fails when two files use the same one):
 * catalog: home, browse, item, tag, source, unilibrary, shelf, importance, report, collection, readingList, notebook
 * reader: reader, annotation, offline, my, notes
 * upload: upload, material, listEditor, myUploads
 * manage: manage
 */
export const areas = { catalog, reader, upload, manage }

export default { library: { ...catalog, ...reader, ...upload, ...manage } } as Messages
