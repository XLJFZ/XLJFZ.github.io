import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

function privateJpegFixture() {
  const tiff = new Uint8Array(245);
  const view = new DataView(tiff.buffer);
  const ascii = (offset, value) =>
    tiff.set(new TextEncoder().encode(`${value}\0`), offset);
  const entry = (offset, tag, type, count, value) => {
    view.setUint16(offset, tag, true);
    view.setUint16(offset + 2, type, true);
    view.setUint32(offset + 4, count, true);
    view.setUint32(offset + 8, value, true);
  };
  const rational = (offset, numerator, denominator = 1) => {
    view.setUint32(offset, numerator, true);
    view.setUint32(offset + 4, denominator, true);
  };

  view.setUint16(0, 0x4949, false);
  view.setUint16(2, 42, true);
  view.setUint32(4, 8, true);
  view.setUint16(8, 5, true);
  entry(10, 0x0110, 2, 12, 74);
  entry(22, 0x013b, 2, 6, 86);
  entry(34, 0x0132, 2, 20, 92);
  entry(46, 0x8769, 4, 1, 112);
  entry(58, 0x8825, 4, 1, 143);
  ascii(74, 'Test Camera');
  ascii(86, 'Alice');
  ascii(92, '2026:09:04 12:34:56');

  view.setUint16(112, 1, true);
  entry(114, 0xa431, 2, 9, 134);
  ascii(134, 'BODY-123');

  view.setUint16(143, 4, true);
  entry(145, 1, 2, 2, 0x4e);
  entry(157, 2, 5, 3, 197);
  entry(169, 3, 2, 2, 0x45);
  entry(181, 4, 5, 3, 221);
  rational(197, 31);
  rational(205, 13);
  rational(213, 30);
  rational(221, 121);
  rational(229, 28);
  rational(237, 30);

  const jpeg = new Uint8Array(2 + 4 + 6 + tiff.length + 2);
  jpeg.set([0xff, 0xd8, 0xff, 0xe1], 0);
  new DataView(jpeg.buffer).setUint16(4, tiff.length + 8, false);
  jpeg.set([0x45, 0x78, 0x69, 0x66, 0, 0], 6);
  jpeg.set(tiff, 12);
  jpeg.set([0xff, 0xd9], jpeg.length - 2);
  return jpeg;
}

test('EXIF privacy checker is local, selective, and verifies cleaned copies', async () => {
  const [component, library, page, tools] = await Promise.all([
    readFile('src/components/exif-privacy-checker.tsx', 'utf8'),
    readFile('src/lib/exif-privacy.ts', 'utf8'),
    readFile('src/app/tools/exif-privacy/page.tsx', 'utf8'),
    readFile('src/app/tools/page.tsx', 'utf8'),
  ]);

  for (const label of [
    'GPS 位置',
    '设备标识',
    '所有者',
    '拍摄时间',
    '备注与编辑信息',
  ]) {
    assert.match(component, new RegExp(label));
  }
  assert.match(component, /照片不会上传/);
  assert.match(component, /原文件保持不变/);
  assert.match(component, /remaining\.some/);
  assert.match(component, /type="checkbox"/);
  assert.match(library, /0xa431/);
  assert.match(library, /0xa435/);
  assert.match(library, /0xa430/);
  assert.match(library, /0x9003/);
  assert.match(page, /不改变画质与像素/);
  assert.match(tools, /href: '\/tools\/exif-privacy\/'/);
});

test('selective cleaning removes chosen privacy tags and preserves unselected EXIF', async () => {
  const { cleanExifPrivacy, inspectExifPrivacy } =
    await import('../src/lib/exif-privacy.ts');
  const source = privateJpegFixture();
  const before = inspectExifPrivacy(source.buffer);
  assert.deepEqual(
    new Set(before.map((item) => item.category)),
    new Set(['location', 'serial', 'owner', 'time']),
  );

  const cleaned = cleanExifPrivacy(
    source.buffer,
    new Set(['location', 'serial', 'owner']),
  );
  const after = inspectExifPrivacy(cleaned.buffer);
  assert.deepEqual(
    after.map((item) => item.category),
    ['time'],
  );
  const text = new TextDecoder().decode(cleaned);
  assert.match(text, /Test Camera/);
  assert.match(text, /2026:09:04 12:34:56/);
  assert.doesNotMatch(text, /Alice|BODY-123/);
});
