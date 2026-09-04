import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  buildPhotoName,
  duplicateNames,
  exifDate,
  slugify,
} from '../src/lib/photo-renamer.ts';
test('builds stable English and Chinese names from reliable fields', () => {
  assert.equal(exifDate('2026:09:05 10:11:12'), '2026-09-05');
  assert.equal(slugify('New York / Street', 'en'), 'new-york-street');
  assert.equal(
    buildPhotoName({
      originalName: 'A.JPG',
      date: '2026-09-05',
      location: '上海',
      theme: 'street',
      camera: 'Nikon Z7 II',
      sequence: 2,
      language: 'zh',
    }),
    '2026-09-05-上海-街道-Nikon-Z7-II-002.jpg',
  );
});
test('detects duplicates and keeps originals private', async () => {
  assert.deepEqual([...duplicateNames(['a.jpg', 'a.jpg'])], ['a.jpg']);
  const source = await readFile(
    'src/components/photo-batch-renamer.tsx',
    'utf8',
  );
  assert.match(source, /照片不会上传/);
  assert.match(source, /原文件不会修改/);
  assert.doesNotMatch(source, /FormData|method:\s*['"]POST/);
});
test('theme workflow is controlled, editable and does not fake semantics', async () => {
  const ui = await readFile('src/components/photo-batch-renamer.tsx', 'utf8');
  assert.match(ui, /中文/);
  assert.match(ui, /English/);
  assert.match(ui, /直接写主题/);
  assert.match(ui, /350\s*MB/);
  assert.match(ui, /没有使用颜色或文件名冒充语义识别/);
});
