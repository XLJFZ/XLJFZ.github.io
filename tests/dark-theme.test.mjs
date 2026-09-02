import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const themedFiles = [
  'src/app/page.tsx',
  'src/app/about/page.tsx',
  'src/app/series/page.tsx',
  'src/app/series/[slug]/page.tsx',
  'src/components/site-header.tsx',
  'src/components/site-footer.tsx',
  'src/components/lightbox-gallery.tsx',
];

test('portfolio uses a warm dark-gray theme with matching content colors', async () => {
  const globals = await readFile('src/app/globals.css', 'utf8');
  const sources = await Promise.all(
    themedFiles.map((file) => readFile(file, 'utf8')),
  );

  assert.match(globals, /color-scheme:\s*dark/);
  assert.match(globals, /--background:\s*oklch\(0\.205 0\.006 72\)/);
  assert.match(globals, /--foreground:\s*oklch\(0\.91 0\.008 78\)/);

  for (const [index, source] of sources.entries()) {
    assert.doesNotMatch(
      source,
      /(?:text|border)-black(?:\/|\b)/,
      `${themedFiles[index]} contains a light-theme text or border color`,
    );
    assert.doesNotMatch(
      source,
      /bg-neutral-200/,
      `${themedFiles[index]} contains a light image placeholder`,
    );
  }
});

test('same-origin navigation uses restrained progressive page transitions', async () => {
  const globals = await readFile('src/app/globals.css', 'utf8');

  assert.match(globals, /@view-transition\s*{\s*navigation:\s*auto/);
  assert.match(globals, /::view-transition-old\(root\)/);
  assert.match(globals, /::view-transition-new\(root\)/);
  assert.match(globals, /prefers-reduced-motion:\s*reduce/);
  assert.match(
    globals,
    /::view-transition-new\(root\)[\s\S]*?animation:\s*none !important/,
  );
});
