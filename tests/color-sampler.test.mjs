import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { analyzePixels, combineSamples } from '../src/lib/color-sampler.ts';

test('color sampling calculates dominant colors and light balance', () => {
  const sample = analyzePixels(
    new Uint8ClampedArray([
      16, 16, 16, 255, 240, 240, 240, 255, 16, 16, 16, 255,
    ]),
  );
  assert.equal(sample.palette[0].hex, '#101010');
  assert.deepEqual(sample.lightBalance, { dark: 2 / 3, mid: 0, light: 1 / 3 });
  const combined = combineSamples([sample, sample]);
  assert.equal(combined.pixelCount, 6);
  assert.equal(combined.lightBalance.dark, 2 / 3);
});

test('color sampler keeps photos local and leaves originals untouched', async () => {
  const [component, page] = await Promise.all([
    readFile('src/components/color-sampler.tsx', 'utf8'),
    readFile('src/app/tools/color-sampler/page.tsx', 'utf8'),
  ]);
  assert.match(component, /createImageBitmap\(file\)/);
  assert.doesNotMatch(component, /fetch\(|XMLHttpRequest|FormData/);
  assert.match(component, /照片不会上传，原文件不会修改/);
  assert.match(page, /主色、综合色板和明暗比例/);
});
