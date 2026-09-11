import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';

// 与 src/lib/portfolio.ts 的 MAX_GALLERY_WIDTH 保持一致。
const MAX_GALLERY_WIDTH = 4096;

async function listImages(directory) {
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return listImages(target);
      return /\.(jpe?g|png|webp)$/i.test(entry.name) ? [target] : [];
    }),
  );
  return nested.flat();
}

test('every gallery photograph has responsive high-quality previews', async () => {
  const [portfolio, gallery] = await Promise.all([
    readFile('src/lib/portfolio.ts', 'utf8'),
    readFile('src/components/lightbox-gallery.tsx', 'utf8'),
  ]);
  const records = [
    ...new Map(
      [
        ...portfolio.matchAll(
          /src: '(\/portfolio\/[^']+)',\s*\n\s*width: (\d+)/g,
        ),
      ].map((match) => [match[1], Number(match[2])]),
    ),
  ];

  assert.equal(records.length, 45);
  assert.match(gallery, /srcSet=/);
  assert.match(gallery, /galleryPreviewSrc\(image\.src\)\} 1200w/);
  assert.match(gallery, /galleryPreviewSrc\(image\.src, 1800\)\} 1800w/);
  assert.match(
    gallery,
    /\$\{galleryMaxSrc\(image\)\} \$\{galleryMaxWidth\(image\)\}w/,
  );
  assert.match(gallery, /sizes=/);

  for (const [source, width] of records) {
    const previewBase = source
      .replace('/portfolio/', 'public/portfolio-previews/')
      .replace(/\.[^.]+$/, '');
    const maxWidth = Math.min(width, MAX_GALLERY_WIDTH);
    const tiers = maxWidth > 1800 ? [1200, 1800, maxWidth] : [1200, 1800];
    for (const tier of tiers) {
      const preview = `${previewBase}-${tier}.jpg`;
      assert.ok((await stat(path.normalize(preview))).size > 0, preview);
    }
  }
});

test('full-resolution originals are never published with the site', async () => {
  await assert.rejects(
    stat('public/portfolio'),
    'public/portfolio must not exist: only derived previews ship with the site',
  );
});

test('published gallery images never exceed the maximum published width', async () => {
  const files = await listImages('public/portfolio-previews');
  assert.ok(files.length > 0, 'expected generated previews');

  for (const file of files) {
    const metadata = await sharp(file).metadata();
    assert.ok(
      metadata.width <= MAX_GALLERY_WIDTH,
      `${file} is ${metadata.width}px wide`,
    );
  }
});
