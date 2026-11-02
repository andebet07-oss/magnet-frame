// Thin adapter over Supabase: every database and storage call the app makes, nothing else.
// The logic lives in cloudRepo.js, which unit tests drive with an in-memory gateway instead.
import { BUCKET } from './paths';

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export function createSupabaseGateway(client) {
  const files = client.storage.from(BUCKET);
  const templates = () => client.from('templates');

  return {
    async listTemplates() {
      return unwrap(await templates().select('id, name, updated_at, revision, size:doc->size, tags:doc->tags').order('updated_at', { ascending: false }));
    },
    /** Null when the template doesn't exist or belongs to someone else. */
    async getTemplate(id) {
      return unwrap(await templates().select('id, name, doc, revision').eq('id', id).maybeSingle());
    },
    async getRevision(id) {
      return unwrap(await templates().select('revision').eq('id', id).maybeSingle())?.revision ?? null;
    },
    async insertTemplate(row) {
      return unwrap(await templates().insert(row).select('revision').single());
    },
    /** Updates only if the stored revision still matches. Returns the updated rows (0 or 1). */
    async updateTemplate(id, patch, expectedRevision) {
      return unwrap(await templates().update(patch).eq('id', id).eq('revision', expectedRevision).select('revision'));
    },
    async deleteTemplate(id) {
      unwrap(await templates().delete().eq('id', id));
    },

    async upload(key, blob, { contentType, upsert = false }) {
      unwrap(await files.upload(key, blob, { contentType, upsert, cacheControl: '3600' }));
    },
    async download(key) {
      return unwrap(await files.download(key));
    },
    /** Direct children of a folder: files have an id, sub-folders have id null. */
    async list(prefix) {
      return unwrap(await files.list(prefix, { limit: 1000 }));
    },
    async remove(keys) {
      if (keys.length) unwrap(await files.remove(keys));
    },
    /** [{ path, signedUrl, error }] — error is set for files that don't exist. */
    async signedUrls(keys, expiresInSeconds) {
      if (!keys.length) return [];
      return unwrap(await files.createSignedUrls(keys, expiresInSeconds));
    },
  };
}
