import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const navigationFiles = [
  'components/site-header.tsx',
  'app/page.tsx',
  'app/series/page.tsx',
  'app/series/[slug]/page.tsx',
];

test('internal navigation uses native links in the deployed site', async () => {
  const sources = await Promise.all(
    navigationFiles.map((file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8')),
  );

  for (const source of sources) {
    assert.doesNotMatch(source, /from ['"]next\/link['"]/, 'next/link breaks clicks in the deployed runtime');
  }

  assert.match(sources[0], /<a[^>]+href="\/series"[^>]*>作品<\/a>/s);
  assert.match(sources[0], /<a[^>]+href="\/about"[^>]*>关于<\/a>/s);
});
