import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('every gallery photograph has responsive high-quality previews', async () => {
  const [portfolio, gallery] = await Promise.all([
    readFile('src/lib/portfolio.ts', 'utf8'),
    readFile('src/components/lightbox-gallery.tsx', 'utf8'),
  ]);
  const sources = [
    ...new Set(
      [...portfolio.matchAll(/src: '(\/portfolio\/[^']+)'/g)].map(
        (match) => match[1],
      ),
    ),
  ];

  assert.equal(sources.length, 45);
  assert.match(gallery, /srcSet=/);
  assert.match(gallery, /galleryPreviewSrc\(image\.src\)\} 1200w/);
  assert.match(gallery, /galleryPreviewSrc\(image\.src, 1800\)\} 1800w/);
  assert.match(gallery, /\$\{image\.src\} \$\{image\.width\}w/);
  assert.match(gallery, /sizes=/);

  for (const source of sources) {
    const previewBase = source
      .replace('/portfolio/', 'public/portfolio-previews/')
      .replace(/\.[^.]+$/, '');
    for (const width of [1200, 1800]) {
      const preview = `${previewBase}-${width}.jpg`;
      assert.ok((await stat(path.normalize(preview))).size > 0, preview);
    }
  }
});
