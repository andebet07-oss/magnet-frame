// Templates on disk: one folder per template, holding template.json, thumbnail.png and assets/.
import { createTemplateDoc, migrateTemplate } from '@/model/schema';
import { sanitizeName, splitExtension, uniqueName } from '@/model/names';
import { copyDir, getDir, listNames, listSubdirs, readFile, readJson, writeFile } from './fs';

export const TEMPLATE_FILE = 'template.json';
export const THUMBNAIL_FILE = 'thumbnail.png';
export const ASSETS_DIR = 'assets';

const isReserved = (name) => name.startsWith('.') || name.startsWith('_');

/** All templates in the library, newest first. Folders that aren't templates are skipped. */
export async function listTemplates(root) {
  const items = [];
  for (const { name, handle } of await listSubdirs(root)) {
    if (isReserved(name)) continue;
    try {
      const doc = migrateTemplate(await readJson(handle, TEMPLATE_FILE));
      items.push({ folder: name, doc, thumbnailUrl: await thumbnailUrl(handle) });
    } catch (err) {
      if (err?.name !== 'NotFoundError') console.warn(`[library] skipped folder "${name}":`, err.message);
    }
  }
  return items.sort((a, b) => String(b.doc.updatedAt).localeCompare(String(a.doc.updatedAt)));
}

async function thumbnailUrl(dir) {
  try {
    return URL.createObjectURL(await readFile(dir, THUMBNAIL_FILE));
  } catch {
    return null;
  }
}

export async function createTemplate(root, name) {
  const doc = createTemplateDoc(name);
  const folder = uniqueName(sanitizeName(name), await listNames(root));
  await writeFile(await root.getDirectoryHandle(folder, { create: true }), TEMPLATE_FILE, serialize(doc));
  return { folder, doc };
}

export async function loadTemplate(root, folder) {
  return migrateTemplate(await readJson(await root.getDirectoryHandle(folder), TEMPLATE_FILE));
}

export async function saveTemplate(root, folder, doc) {
  const dir = await root.getDirectoryHandle(folder);
  await writeFile(dir, TEMPLATE_FILE, serialize({ ...doc, updatedAt: new Date().toISOString() }));
}

export async function saveThumbnail(root, folder, blob) {
  await writeFile(await root.getDirectoryHandle(folder), THUMBNAIL_FILE, blob);
}

/** Renames the template and its folder (copy, then delete the old folder). Returns the new folder name. */
export async function renameTemplate(root, folder, newName) {
  const source = await root.getDirectoryHandle(folder);
  const doc = migrateTemplate(await readJson(source, TEMPLATE_FILE));
  const renamed = { ...doc, name: newName, updatedAt: new Date().toISOString() };
  const others = (await listNames(root)).filter((n) => n !== folder);
  const target = uniqueName(sanitizeName(newName), others);

  if (target === folder) {
    await writeFile(source, TEMPLATE_FILE, serialize(renamed));
    return folder;
  }
  const dest = await root.getDirectoryHandle(target, { create: true });
  try {
    await copyDir(source, dest);
    await writeFile(dest, TEMPLATE_FILE, serialize(renamed));
  } catch (err) {
    await root.removeEntry(target, { recursive: true }).catch(() => {});
    throw err;
  }
  await root.removeEntry(folder, { recursive: true });
  return target;
}

export async function deleteTemplate(root, folder) {
  await root.removeEntry(folder, { recursive: true });
}

/** Copies an uploaded file into the template's assets/ folder. Returns its relative path. */
export async function addAsset(root, folder, file) {
  const assets = await getDir(await root.getDirectoryHandle(folder), ASSETS_DIR, { create: true });
  const { stem, ext } = splitExtension(file.name);
  const taken = (await listNames(assets)).map((n) => splitExtension(n).stem);
  const name = `${uniqueName(sanitizeName(stem, 'image'), taken)}${ext}`;
  await writeFile(assets, name, file);
  return `${ASSETS_DIR}/${name}`;
}

export async function readAsset(root, folder, path) {
  return readFile(await root.getDirectoryHandle(folder), path);
}

function serialize(doc) {
  return `${JSON.stringify(doc, null, 2)}\n`;
}
