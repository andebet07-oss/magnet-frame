// Templates of one signed-in user, in the cloud. Same jobs the local-folder version had:
// list, create, load, save, rename, delete, images and thumbnails.
import { DEFAULT_SIZE, migrateTemplate } from '@/model/schema';
import { createPresetDoc, DEFAULT_PRESET } from '@/model/presets';
import { ConflictError, NotFoundError, UnsupportedImageError } from './errors';
import { ASSETS_DIR, assetFileName, imageTypeOf, templatePrefix, THUMBNAIL_FILE } from './paths';

const THUMBNAIL_URL_SECONDS = 60 * 60;

/**
 * @param gateway  see supabaseGateway.js (or the in-memory one in tests)
 * @param userId   signed-in user; every storage key starts with it
 */
export function createCloudRepo(gateway, userId) {
  const prefix = (templateId) => templatePrefix(userId, templateId);

  async function listKeys(folder) {
    const keys = [];
    for (const entry of await gateway.list(folder)) {
      const key = `${folder}/${entry.name}`;
      if (entry.id === null || entry.id === undefined) keys.push(...(await listKeys(key)));
      else keys.push(key);
    }
    return keys;
  }

  const repo = {
    userId,

    /** Library rows, newest first: { id, name, updatedAt, revision, size, tags, thumbnailUrl }. */
    async list() {
      const rows = await gateway.listTemplates();
      const keys = rows.map((r) => `${prefix(r.id)}/${THUMBNAIL_FILE}`);
      const urls = new Map();
      try {
        for (const u of await gateway.signedUrls(keys, THUMBNAIL_URL_SECONDS)) if (!u.error && u.signedUrl) urls.set(u.path, u.signedUrl);
      } catch (err) {
        console.warn('[cloud] thumbnails unavailable:', err.message);
      }
      return rows.map((r, i) => ({
        id: r.id,
        name: r.name,
        updatedAt: r.updated_at,
        revision: r.revision,
        size: { ...DEFAULT_SIZE, ...r.size },
        tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
        thumbnailUrl: urls.get(keys[i]) ?? null,
      }));
    },

    /** New template with a standard size and layout (see model/presets.js). */
    async create(name, preset = DEFAULT_PRESET) {
      const doc = createPresetDoc(name, preset);
      const { revision } = await gateway.insertTemplate({ id: doc.id, name: doc.name, doc });
      return { id: doc.id, doc, revision };
    },

    /** Adds an existing document (zip import) as a new template. */
    async insert(doc) {
      const { revision } = await gateway.insertTemplate({ id: doc.id, name: doc.name, doc });
      return { id: doc.id, revision };
    },

    async load(id) {
      const row = await gateway.getTemplate(id);
      if (!row) throw new NotFoundError();
      return { doc: migrateTemplate({ ...row.doc, id: row.id }), revision: row.revision };
    },

    /**
     * Saves only if nobody saved since `expectedRevision`; returns the new revision.
     * Throws ConflictError if someone did, NotFoundError if the template was deleted.
     */
    async save(id, doc, expectedRevision) {
      const stamped = { ...doc, id, updatedAt: new Date().toISOString() };
      const rows = await gateway.updateTemplate(id, { name: doc.name, doc: stamped }, expectedRevision);
      if (rows.length) return rows[0].revision;
      const latest = await gateway.getRevision(id);
      if (latest === null) throw new NotFoundError();
      throw new ConflictError(latest);
    },

    async currentRevision(id) {
      const revision = await gateway.getRevision(id);
      if (revision === null) throw new NotFoundError();
      return revision;
    },

    async rename(id, name) {
      const { doc, revision } = await repo.load(id);
      return repo.save(id, { ...doc, name }, revision);
    },

    /** Deletes the template, then its files (a leftover file is harmless; a leftover row is not). */
    async remove(id) {
      await gateway.deleteTemplate(id);
      try {
        await gateway.remove(await listKeys(prefix(id)));
      } catch (err) {
        console.warn(`[cloud] files of deleted template ${id} not removed:`, err.message);
      }
    },

    /** Uploads an image for a template; returns its path inside the template ("assets/leaf.svg"). */
    async uploadAsset(id, file, { name = file.name } = {}) {
      const type = imageTypeOf(name, file.type);
      if (!type) throw new UnsupportedImageError(file.type);
      const folder = `${prefix(id)}/${ASSETS_DIR}`;
      const taken = (await gateway.list(folder)).map((f) => f.name);
      const fileName = assetFileName(name, type, taken);
      await gateway.upload(`${folder}/${fileName}`, file, { contentType: type });
      return `${ASSETS_DIR}/${fileName}`;
    },

    async readAsset(id, path) {
      return gateway.download(`${prefix(id)}/${path}`);
    },

    async saveThumbnail(id, blob) {
      await gateway.upload(`${prefix(id)}/${THUMBNAIL_FILE}`, blob, { contentType: 'image/png', upsert: true });
    },

    /** Every file of a template, as paths relative to the template folder (for zip export). */
    async listFiles(id) {
      const base = `${prefix(id)}/`;
      return (await listKeys(prefix(id))).map((k) => k.slice(base.length));
    },
  };
  return repo;
}
