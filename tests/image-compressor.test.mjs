import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('image compressor is local, keeps EXIF, and uses three simple presets', async () => {
  const source = await readFile('src/components/image-compressor.tsx', 'utf8');
  const page = await readFile(
    'src/app/tools/image-compressor/page.tsx',
    'utf8',
  );

  assert.match(source, /import Compressor from ['"]compressorjs['"]/);
  assert.match(source, /retainExif:\s*true/);
  assert.match(source, /const presets = \[/);
  assert.match(source, /id: ['"]light['"]/);
  assert.match(source, /id: ['"]balanced['"]/);
  assert.match(source, /id: ['"]large['"]/);
  assert.doesNotMatch(source, /type="range"/);
  assert.match(page, /照片[\s\S]*不会被修改/);
});
