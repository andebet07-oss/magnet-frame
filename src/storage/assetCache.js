// Decoded images for one open template, keyed by their path inside the template folder.
import { readAsset } from './templateRepo';

async function decode(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // A decoded image keeps its data; the URL is no longer needed.
    URL.revokeObjectURL(url);
  }
}

export function createAssetCache(root, folder) {
  const images = new Map(); // path → HTMLImageElement, or null when the file is missing/broken
  const inflight = new Map();

  async function load(path) {
    try {
      images.set(path, await decode(await readAsset(root, folder, path)));
    } catch (err) {
      console.error(`[assets] could not load "${path}":`, err.message);
      images.set(path, null);
    }
  }

  return {
    has: (path) => images.has(path),
    get: (path) => images.get(path) ?? null,
    /** Load every path not tried yet. Never rejects; failures are cached as null. */
    ensure(paths) {
      const pending = paths
        .filter((p) => !images.has(p))
        .map((p) => {
          if (!inflight.has(p)) inflight.set(p, load(p).finally(() => inflight.delete(p)));
          return inflight.get(p);
        });
      return Promise.all(pending);
    },
    /** Register a file the user just added, without reading it back from disk. */
    async put(path, blob) {
      const img = await decode(blob);
      images.set(path, img);
      return img;
    },
  };
}
