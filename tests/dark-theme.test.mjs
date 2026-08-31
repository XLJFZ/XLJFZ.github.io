import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const themedFiles = [
  'app/page.tsx',
  'app/about/page.tsx',
  'app/series/page.tsx',
  'app/series/[slug]/page.tsx',
  'components/site-header.tsx',
  'components/site-footer.tsx',
  'components/lightbox-gallery.tsx',
];

test('portfolio uses a warm dark-gray theme with matching content colors', async () => {
  const globals = await readFile('app/globals.css', 'utf8');
  const sources = await Promise.all(themedFiles.map((file) => readFile(file, 'utf8')));

  assert.match(globals, /color-scheme:\s*dark/);
  assert.match(globals, /--background:\s*oklch\(0\.205 0\.006 72\)/);
  assert.match(globals, /--foreground:\s*oklch\(0\.91 0\.008 78\)/);

  for (const [index, source] of sources.entries()) {
    assert.doesNotMatch(source, /(?:text|border)-black(?:\/|\b)/, `${themedFiles[index]} contains a light-theme text or border color`);
    assert.doesNotMatch(source, /bg-neutral-200/, `${themedFiles[index]} contains a light image placeholder`);
  }
});
