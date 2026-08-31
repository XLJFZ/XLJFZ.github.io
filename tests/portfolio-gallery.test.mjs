import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

async function listImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return listImages(target);
    return /\.(jpe?g|png|webp)$/i.test(entry.name) ? [target] : [];
  }));
  return nested.flat();
}

test('series gallery is two-column on desktop and one-column on mobile', async () => {
  const gallery = await readFile('components/lightbox-gallery.tsx', 'utf8');
  const page = await readFile('app/series/[slug]/page.tsx', 'utf8');

  assert.match(gallery, /grid-cols-1/);
  assert.match(gallery, /md:grid-cols-2/);
  assert.match(gallery, /md:col-span-2/);
  assert.match(page, /max-w-\[1480px\]/);
});

test('every portfolio asset is referenced once and no photographs are duplicated', async () => {
  const source = await readFile('lib/portfolio.ts', 'utf8');
  const references = [...source.matchAll(/\bsrc: '([^']+)'/g)].map((match) => match[1]);
  const files = await listImages('public/portfolio');
  const publicPaths = files.map((file) => `/${file.replaceAll('\\', '/').replace(/^public\//, '')}`);

  assert.equal(new Set(references).size, references.length, 'duplicate entries in lib/portfolio.ts');
  assert.deepEqual(
    [...references].sort((left, right) => left.localeCompare(right)),
    [...publicPaths].sort((left, right) => left.localeCompare(right)),
  );

  const hashes = await Promise.all(files.map(async (file) => {
    const contents = await readFile(file);
    return createHash('sha256').update(contents).digest('hex');
  }));
  assert.equal(new Set(hashes).size, hashes.length, 'duplicate image files in public/portfolio');
});
