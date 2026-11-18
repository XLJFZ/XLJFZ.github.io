import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzePhotos } from '../src/lib/photo-analysis.ts';

test('counts ISO timestamps with a T separator in the matching hour bucket', () => {
  const result = analyzePhotos([
    { name: 'photo.jpg', metadata: { capturedAt: '2026-05-01T14:30:00' } },
  ]);
  assert.equal(result.timeCount, 1);
  assert.equal(result.time.find(({ label }) => label === '下午 14–17')?.count, 1);
});
