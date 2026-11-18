import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';
import {
  analyzePixels,
  findEmbeddedJpeg,
  groupDuplicates,
  hammingDistance,
  isQualityPhoto,
  QUALITY_PRESETS,
} from '../src/lib/photo-quality.ts';

test('computes clipping ratios, sharpness evidence and perceptual hashes', () => {
  const pixels = new Uint8ClampedArray([
    0, 0, 0, 255, 255, 255, 255, 255, 40, 40, 40, 255, 255, 255, 255, 255, 0, 0,
    0, 255, 200, 200, 200, 255, 20, 20, 20, 255, 240, 240, 240, 255, 100, 100,
    100, 255,
  ]);
  const result = analyzePixels(pixels, 3, 3);
  assert.equal(result.highlightRatio, 2 / 9);
  assert.equal(result.shadowRatio, 2 / 9);
  assert.ok(result.blurVariance >= 0);
  assert.match(result.perceptualHash, /^[0-9a-f]{16}$/);
});

test('groups exact hashes separately and near duplicates by perceptual distance', () => {
  const items = [
    { name: 'a.jpg', exactHash: 'same', perceptualHash: '0000000000000000' },
    { name: 'copy.jpg', exactHash: 'same', perceptualHash: '0000000000000000' },
    {
      name: 'edit.jpg',
      exactHash: 'other',
      perceptualHash: '0000000000000003',
    },
  ];
  const groups = groupDuplicates(items, 2);
  assert.equal(groups.exactGroups.length, 1);
  assert.equal(groups.nearGroups.length, 1);
  assert.equal(
    hammingDistance(items[0].perceptualHash, items[2].perceptualHash),
    2,
  );
});

test('accepts common RAW formats and finds an embedded JPEG preview', async () => {
  for (const extension of ['dng', 'nef', 'arw', 'cr2', 'raf', '3fr', 'fff'])
    assert.equal(isQualityPhoto({ name: `raw.${extension}`, type: '' }), true);
  const jpeg = await makeJpeg(24);
  const source = Uint8Array.from(Buffer.concat([Buffer.of(1, 2), jpeg, Buffer.of(3)])).buffer;
  assert.deepEqual(findEmbeddedJpeg(source), [2, 2 + jpeg.length]);
});

test('page keeps analysis local, sequential and evidence bounded', async () => {
  const source = await readFile(
    'src/components/photo-quality-screener.tsx',
    'utf8',
  );
  assert.match(source, /照片逐张在浏览器本地分析/);
  assert.match(source, /不会自动删除、淘汰或覆盖照片/);
  assert.match(source, /for \(let index = 0; index < files\.length/);
  assert.match(source, /bitmap\?\.close\(\)/);
  assert.match(source, /URL\.revokeObjectURL/);
  assert.match(source, /长曝光、浅景深、夜景、高调或低调作品/);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|FormData/);
  assert.deepEqual(Object.keys(QUALITY_PRESETS), ['宽松', '推荐', '严格']);
});

test('compares perceptual hashes when both exact hashes are empty', () => {
  const items = [
    { exactHash: '', perceptualHash: '0000000000000000' },
    { exactHash: '', perceptualHash: '0000000000000001' },
  ];
  assert.deepEqual(groupDuplicates(items, 1), {
    exactGroups: [],
    nearGroups: [items],
  });
});

function makeJpeg(width) {
  return sharp({ create: { width, height: width, channels: 3, background: 'white' } })
    .jpeg({ progressive: true })
    .toBuffer();
}

function addAppSegment(jpeg, marker, payload) {
  const header = Buffer.of(0xff, marker, 0, 0);
  header.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([jpeg.subarray(0, 2), header, payload, jpeg.subarray(2)]);
}

test('returns the full main JPEG when its APP1 contains a thumbnail', async () => {
  const jpeg = addAppSegment(await makeJpeg(24), 0xe1, await makeJpeg(8));
  const source = Uint8Array.from(Buffer.concat([Buffer.of(0), jpeg, Buffer.of(0)])).buffer;
  assert.deepEqual(findEmbeddedJpeg(source), [1, 1 + jpeg.length]);
});

test('ignores marker-like APP payload bytes and extracts a decodable preview', async () => {
  const jpeg = addAppSegment(await makeJpeg(24), 0xe2, Buffer.of(1, 0xff, 0xd9, 2));
  const source = Uint8Array.from(jpeg).buffer;
  const span = findEmbeddedJpeg(source);
  assert.deepEqual(span, [0, jpeg.length]);
  const { info } = await sharp(Buffer.from(source.slice(...span))).raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 24);
});
