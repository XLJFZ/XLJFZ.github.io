import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import {
  maximumPreviewWidth,
  previewWidths,
  MAX_PREVIEW_EDGE,
} from '../src/lib/preview-policy.mjs';
import { filesUnder } from '../scripts/check-published-assets.mjs';

test('homepage tiers retain the verified Rec.2020 ICC and strip descriptive metadata', async () => {
  const evidence = JSON.parse(
    await readFile('docs/HERO-REC2020-2026-10-11.json', 'utf8'),
  );
  for (const width of evidence.widths) {
    const meta = await sharp(
      `public/hero-previews/hero-zbz-2714-${width}.jpg`,
    ).metadata();
    assert.equal(
      createHash('sha256').update(meta.icc).digest('hex'),
      evidence.profileSha256,
    );
    assert.equal(meta.width, width);
    assert.equal(meta.exif, undefined);
    assert.equal(meta.xmp, undefined);
    assert.equal(meta.iptc, undefined);
  }
});

test('P3 resizing embeds the colour profile without descriptive metadata', async () => {
  const input = await sharp({
    create: { width: 64, height: 48, channels: 3, background: '#ff6000' },
  })
    .withIccProfile('p3')
    .jpeg()
    .toBuffer();
  const output = await sharp(input)
    .pipelineColourspace('rgb16')
    .resize({ width: 32 })
    .withIccProfile('p3')
    .jpeg()
    .toBuffer();
  const before = await sharp(input).metadata();
  const after = await sharp(output).metadata();
  assert.deepEqual(after.icc, before.icc);
  assert.equal(after.width, 32);
  assert.equal(after.height, 24);
  assert.equal(after.exif, undefined);
  assert.equal(after.xmp, undefined);
  assert.equal(after.iptc, undefined);
});

test('preview tiers constrain the long edge and never enlarge small originals', () => {
  assert.equal(maximumPreviewWidth({ width: 4000, height: 6000 }), 2730);
  assert.equal(maximumPreviewWidth({ width: 6000, height: 4000 }), 4096);
  assert.deepEqual(previewWidths({ width: 800, height: 1200 }), [800]);
  assert.deepEqual(previewWidths({ width: 1680, height: 1120 }), [1200, 1680]);
});

test('migrated photograph tiers and corresponding covers contain Display P3 ICC', async () => {
  const records = JSON.parse(
    await readFile('docs/P3-MIGRATION-2026-10-11.json', 'utf8'),
  );
  assert.equal(records.length, 24);
  const reference = (
    await sharp(
      await sharp({
        create: { width: 1, height: 1, channels: 3, background: 'black' },
      })
        .withIccProfile('p3')
        .png()
        .toBuffer(),
    ).metadata()
  ).icc;
  const files = records.filter(record => !['urban-pulse/tokyo-zbz-8187', 'urban-pulse/beijing-zbz-9579'].includes(record.base)).flatMap((record) =>
    previewWidths(record).map(
      (width) => `public/portfolio-previews/${record.base}-${width}.jpg`,
    ),
  );
  files.push(
    'public/covers/urban-pulse.jpg',
    'public/covers/urban-pulse-1200.jpg',
    'public/covers/distant-weather-1200.jpg',
  );
  for (const file of files) {
    const metadata = await sharp(file).metadata();
    assert.deepEqual(metadata.icc, reference, file);
    assert.equal(metadata.exif, undefined, file);
    assert.equal(metadata.xmp, undefined, file);
    assert.equal(metadata.iptc, undefined, file);
  }
});

test('every photograph has correctly described responsive previews', async () => {
  const source = await readFile('src/lib/portfolio.ts', 'utf8');
  const records = [
    ...source.matchAll(
      /src: '(\/portfolio-previews\/[^']+)',\s*width: (\d+),\s*height: (\d+)/g,
    ),
  ];
  assert.equal(records.length, 54);
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
