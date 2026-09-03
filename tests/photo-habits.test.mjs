import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { analyzePhotos, evaluateLensNeed } from '../src/lib/photo-analysis.ts';
import { parsePhotoMetadata } from '../src/lib/photo-metadata.ts';

test('reads focal length and exposure fields from a real portfolio JPEG', async () => {
  const file = await readFile(
    'public/portfolio/urban-pulse/shanghai-zbz-0216.jpg',
  );
  const source = file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength,
  );
  const metadata = parsePhotoMetadata(source);

  assert.equal(metadata?.focalLength, 48);
  assert.equal(metadata?.aperture, 7.1);
  assert.equal(metadata?.iso, 64);
  assert.equal(metadata?.exposureTime, 1 / 125);
});

test('builds distributions without counting missing EXIF as zero', () => {
  const result = analyzePhotos([
    {
      name: 'a.jpg',
      metadata: {
        focalLength: 50,
        aperture: 2.8,
        iso: 100,
        exposureTime: 1 / 125,
        capturedAt: '2026:08:20 18:30:00',
      },
    },
    { name: 'missing.jpg', metadata: null },
  ]);

  assert.equal(result.total, 2);
  assert.equal(result.focalCount, 1);
  assert.equal(result.focal.find((item) => item.label === '35–59mm')?.count, 1);
  assert.equal(
    result.time.find((item) => item.label === '傍晚 18–21')?.count,
    1,
  );
});

test('lens advice is evidence-bounded by usable focal-length sample size', () => {
  const insufficient = evaluateLensNeed([35, 35, 50], {
    label: '35mm',
    min: 30,
    max: 40,
  });
  assert.equal(insufficient.tone, 'insufficient');

  const strong = evaluateLensNeed(
    [70, 85, 105, 135, 200, 80, 90, 120, 150, 180, 24, 35],
    { label: '70–200mm', min: 70, max: 200 },
  );
  assert.equal(strong.tone, 'strong');
  assert.equal(strong.inRange, 10);
});

test('tool keeps local photos private and can read the published portfolio', async () => {
  const source = await readFile(
    'src/components/photo-habits-analyzer.tsx',
    'utf8',
  );
  assert.match(source, /照片不会上传/);
  assert.match(source, /35mm[\s\S]*等效焦段/);
  assert.match(source, /一键分析本站/);
  assert.match(source, /fetch\(photo\.url/);
  assert.doesNotMatch(source, /XMLHttpRequest|FormData|method:\s*['"]POST/);
});
