// Small helpers over FileSystemDirectoryHandle. Paths are "a/b/c.png", relative to a directory.

function splitPath(path) {
  return path.split('/').filter(Boolean);
}

export async function getDir(dir, path, { create = false } = {}) {
  let current = dir;
  for (const part of splitPath(path)) current = await current.getDirectoryHandle(part, { create });
  return current;
}

async function parentAndName(dir, path, create) {
  const parts = splitPath(path);
  const name = parts.pop();
  return { parent: await getDir(dir, parts.join('/'), { create }), name };
}

export async function readFile(dir, path) {
  const { parent, name } = await parentAndName(dir, path, false);
  const handle = await parent.getFileHandle(name);
  return handle.getFile();
}

export async function readJson(dir, path) {
  return JSON.parse(await (await readFile(dir, path)).text());
}

/** Chrome writes to a temporary file and swaps it in on close(), so a crash never leaves half a file. */
export async function writeFile(dir, path, data) {
  const { parent, name } = await parentAndName(dir, path, true);
  const handle = await parent.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  try {
    await writable.write(data);
    await writable.close();
  } catch (err) {
    await writable.abort().catch(() => {});
    throw err;
  }
}

export async function exists(dir, name) {
  for await (const key of dir.keys()) if (key === name) return true;
  return false;
}

export async function listNames(dir) {
  const names = [];
  for await (const key of dir.keys()) names.push(key);
  return names;
}

export async function listSubdirs(dir) {
  const dirs = [];
  for await (const [name, handle] of dir.entries()) if (handle.kind === 'directory') dirs.push({ name, handle });
  return dirs;
}

export async function copyDir(source, target) {
  for await (const [name, handle] of source.entries()) {
    if (handle.kind === 'directory') {
      await copyDir(handle, await target.getDirectoryHandle(name, { create: true }));
    } else {
      await writeFile(target, name, await handle.getFile());
    }
  }
}
