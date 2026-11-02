import { beforeEach, describe, expect, it } from 'vitest';
import { createCloudRepo } from '@/storage/cloudRepo';
import { assetFileName, imageTypeOf, templatePrefix } from '@/storage/paths';
import { isNetworkError } from '@/storage/errors';
import { createMemoryGateway } from '@/storage/memoryGateway';

const USER = '11111111-1111-4111-8111-111111111111';
const png = (name = 'logo.png', type = 'image/png') => new File([new Uint8Array([137, 80, 78, 71])], name, { type });

describe('storage paths', () => {
  it('keeps every file of a template under the user and template ids', () => {
    expect(templatePrefix(USER, 't1')).toBe(`${USER}/t1`);
  });

  it('turns any file name into a safe ASCII storage name', () => {
    expect(assetFileName('leaf.SVG', 'image/svg+xml')).toBe('leaf.svg');
    expect(assetFileName('לוגו.png', 'image/png')).toBe('image.png');
    expect(assetFileName('Noa & Itai (final).jpeg', 'image/jpeg')).toBe('Noa-Itai-final.jpg');
    expect(assetFileName('café.png', 'image/png')).toBe('cafe.png');
  });

  it('avoids names already taken in the folder', () => {
    expect(assetFileName('logo.png', 'image/png', ['logo.png', 'LOGO-2.png'])).toBe('logo-3.png');
  });

  it('accepts only PNG, JPG, WEBP and SVG', () => {
    expect(() => assetFileName('a.gif', 'image/gif')).toThrow(/Unsupported/);
    expect(imageTypeOf('photo.JPG', '')).toBe('image/jpeg');
    expect(imageTypeOf('doc.pdf', 'application/pdf')).toBeNull();
  });
});

describe('cloud repo', () => {
  let gateway;
  let repo;
  beforeEach(() => {
    gateway = createMemoryGateway();
    repo = createCloudRepo(gateway, USER);
  });

  it('creates a template and lists it with its size, newest first', async () => {
    const a = await repo.create('ראשונה');
    const b = await repo.create('שנייה');
    expect(a.revision).toBe(1);
    const list = await repo.list();
    expect(list.map((t) => t.name)).toEqual(['שנייה', 'ראשונה']);
    expect(list[0]).toMatchObject({ id: b.id, size: { widthMm: 100, heightMm: 150 }, thumbnailUrl: null });
  });

  it('loads the document with its revision', async () => {
    const { id } = await repo.create('חתונה');
    const { doc, revision } = await repo.load(id);
    expect(doc.name).toBe('חתונה');
    expect(doc.elements[0].type).toBe('background');
    expect(revision).toBe(1);
  });

  it('saves with the expected revision and returns the next one', async () => {
    const { id, doc } = await repo.create('חתונה');
    const next = await repo.save(id, { ...doc, name: 'חתונה 2' }, 1);
    expect(next).toBe(2);
    const row = gateway.rows.get(id);
    expect(row.name).toBe('חתונה 2');
    expect(row.doc.name).toBe('חתונה 2');
    expect(row.doc.updatedAt).toBeTruthy();
  });

  it('refuses to overwrite a newer save from another tab or computer', async () => {
    const { id, doc } = await repo.create('חתונה');
    await repo.save(id, { ...doc, name: 'מהמחשב השני' }, 1);
    await expect(repo.save(id, { ...doc, name: 'מהמחשב הזה' }, 1)).rejects.toMatchObject({ name: 'ConflictError', latestRevision: 2 });
    expect(gateway.rows.get(id).name).toBe('מהמחשב השני');
  });

  it('reports a template deleted meanwhile', async () => {
    const { id, doc } = await repo.create('חתונה');
    await repo.remove(id);
    await expect(repo.save(id, doc, 1)).rejects.toMatchObject({ name: 'NotFoundError' });
    await expect(repo.load(id)).rejects.toMatchObject({ name: 'NotFoundError' });
  });

  it('renames in both the list and the document', async () => {
    const { id } = await repo.create('ישן');
    await repo.rename(id, 'חדש');
    const { doc, revision } = await repo.load(id);
    expect(doc.name).toBe('חדש');
    expect(revision).toBe(2);
    expect((await repo.list())[0].name).toBe('חדש');
  });

  it('uploads images under the template folder and reads them back', async () => {
    const { id } = await repo.create('חתונה');
    const first = await repo.uploadAsset(id, png('לוגו.png'));
    const second = await repo.uploadAsset(id, png('לוגו.png'));
    expect(first).toBe('assets/image.png');
    expect(second).toBe('assets/image-2.png');
    expect(gateway.files.has(`${USER}/${id}/assets/image.png`)).toBe(true);
    expect(gateway.files.get(`${USER}/${id}/assets/image.png`).contentType).toBe('image/png');
    expect(await repo.readAsset(id, first)).toBeInstanceOf(Blob);
    await expect(repo.uploadAsset(id, png('anim.gif', 'image/gif'))).rejects.toMatchObject({ name: 'UnsupportedImageError' });
  });

  it('stores thumbnails and shows them in the list', async () => {
    const { id } = await repo.create('חתונה');
    await repo.saveThumbnail(id, new Blob(['png']));
    await repo.saveThumbnail(id, new Blob(['png 2'])); // replacing is allowed
    expect((await repo.list())[0].thumbnailUrl).toBe(`memory://${USER}/${id}/thumbnail.png`);
  });

  it('lists every file of a template and deletes them with it', async () => {
    const { id } = await repo.create('חתונה');
    const other = await repo.create('אחרת');
    await repo.uploadAsset(id, png('a.png'));
    await repo.saveThumbnail(id, new Blob(['png']));
    await repo.uploadAsset(other.id, png('b.png'));
    expect((await repo.listFiles(id)).sort()).toEqual(['assets/a.png', 'thumbnail.png']);

    await repo.remove(id);
    expect(gateway.rows.has(id)).toBe(false);
    expect([...gateway.files.keys()]).toEqual([`${USER}/${other.id}/assets/b.png`]);
  });

  it('turns a dropped connection into a network error the editor can recognise', async () => {
    gateway.offline = true;
    const err = await repo.list().catch((e) => e);
    expect(isNetworkError(err)).toBe(true);
  });
});
