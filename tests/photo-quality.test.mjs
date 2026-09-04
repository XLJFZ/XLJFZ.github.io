import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
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

test('accepts common RAW formats and finds an embedded JPEG preview', () => {
  for (const extension of ['dng', 'nef', 'arw', 'cr2', 'raf', '3fr', 'fff'])
    assert.equal(isQualityPhoto({ name: `raw.${extension}`, type: '' }), true);
  const source = Uint8Array.from([
    1, 2, 0xff, 0xd8, 8, 9, 0xff, 0xd9, 3,
  ]).buffer;
  assert.deepEqual(findEmbeddedJpeg(source), [2, 8]);
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
