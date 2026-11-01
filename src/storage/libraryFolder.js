// The folder on disk that holds all templates (File System Access API, Chrome and Edge only).
import { idbDelete, idbGet, idbSet } from './idb';

const KEY = 'libraryFolder';
const MODE = { mode: 'readwrite' };

export function isFolderAccessSupported() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function pickFolder() {
  const handle = await window.showDirectoryPicker({ id: 'magnet-frame-library', mode: 'readwrite' });
  await idbSet(KEY, handle);
  return handle;
}

export async function getSavedFolder() {
  return (await idbGet(KEY)) ?? null;
}

export async function forgetFolder() {
  await idbDelete(KEY);
}

export async function hasPermission(handle) {
  if (!handle.queryPermission) return true;
  return (await handle.queryPermission(MODE)) === 'granted';
}

/** Must be called from a click: Chrome only shows the permission prompt after a user gesture. */
export async function requestPermission(handle) {
  if (!handle.requestPermission) return true;
  return (await handle.requestPermission(MODE)) === 'granted';
}
