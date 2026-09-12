import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';
import {
  maximumPreviewWidth,
  previewWidths,
  MAX_PREVIEW_EDGE,
} from '../src/lib/preview-policy.mjs';
import { filesUnder } from '../scripts/check-published-assets.mjs';

test('preview tiers constrain the long edge and never enlarge small originals', () => {
  assert.equal(maximumPreviewWidth({ width: 4000, height: 6000 }), 2730);
  assert.equal(maximumPreviewWidth({ width: 6000, height: 4000 }), 4096);
  assert.deepEqual(previewWidths({ width: 800, height: 1200 }), [800]);
  assert.deepEqual(previewWidths({ width: 1680, height: 1120 }), [1200, 1680]);
});

test('every photograph has correctly described responsive previews', async () => {
  const source = await readFile('src/lib/portfolio.ts', 'utf8');
  const records = [
    ...source.matchAll(
      /src: '(\/portfolio-previews\/[^']+)',\s*width: (\d+),\s*height: (\d+)/g,
    ),
  ];
  assert.equal(records.length, 45);
  for (const [, src, w, h] of records) {
    assert.ok((await stat(`public${src}`)).size > 0);
    for (const width of previewWidths({ width: +w, height: +h })) {
      const file = `public${src.replace(/-\d+\.jpg$/, `-${width}.jpg`)}`;
      const m = await sharp(file).metadata();
      assert.equal(m.width, width, file);
      assert.ok(Math.max(m.width, m.height) <= MAX_PREVIEW_EDGE, file);
      assert.ok(
        Math.abs(m.height - (width * Number(h)) / Number(w)) <= 1,
        file,
      );
    }
  }
});

test('original gallery and hero assets are absent from public', async () => {
  await assert.rejects(stat('public/portfolio'));
  await assert.rejects(stat('public/hero-zbz-2714.jpg'));
});

test('all gallery previews obey the long-edge limit', async () => {
  for (const file of await filesUnder('public/portfolio-previews')) {
    const m = await sharp(file).metadata();
    assert.ok(Math.max(m.width, m.height) <= MAX_PREVIEW_EDGE, file);
  }
});
