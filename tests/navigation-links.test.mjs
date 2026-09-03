import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const navigationFiles = [
  'src/components/site-header.tsx',
  'src/app/page.tsx',
  'src/app/series/page.tsx',
  'src/app/series/[slug]/page.tsx',
];

test('internal navigation uses native links in the deployed site', async () => {
  const sources = await Promise.all(
    navigationFiles.map((file) =>
      readFile(new URL(`../${file}`, import.meta.url), 'utf8'),
    ),
  );

  for (const source of sources) {
    assert.doesNotMatch(
      source,
      /from ['"]next\/link['"]/,
      'next/link breaks clicks in the deployed runtime',
    );
  }

  assert.match(sources[0], /<a[^>]+href="\/series\/"[^>]*>\s*作品\s*<\/a>/s);
  assert.match(
    sources[0],
    /<a[^>]+href="\/tools\/photo-habits\/"[^>]*>\s*工具\s*<\/a>/s,
  );
  assert.match(sources[0], /<a[^>]+href="\/about\/"[^>]*>\s*关于\s*<\/a>/s);
});
