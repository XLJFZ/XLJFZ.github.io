import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// 原图不再随站点发布，tests 里不能再用 public/portfolio 下的照片做 EXIF 样本。
// 这里生成一张 8×8 的灰底 JPEG，并写入最小可用的 EXIF（焦距 / 光圈 / ISO / 快门 /
// 拍摄时间），供 src/lib/photo-metadata.ts 的解析测试使用。
// 只用合成数据，不复制任何真实照片的元数据（含 GPS、序列号等隐私字段）。

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const output = path.join(projectRoot, 'tests', 'fixtures', 'exif-sample.jpg');

const EXIF_IFD_OFFSET = 26;
const DATA_START = 92;

function buildTiff() {
  const buffer = new Uint8Array(136);
  const view = new DataView(buffer.buffer);

  view.setUint16(0, 0x4949, false); // "II"
  view.setUint16(2, 42, true);
  view.setUint32(4, 8, true); // IFD0 offset

  // IFD0 —— 只放 ExifIFD 指针
  view.setUint16(8, 1, true);
  view.setUint16(10, 0x8769, true);
  view.setUint16(12, 4, true); // LONG
  view.setUint32(14, 1, true);
  view.setUint32(18, EXIF_IFD_OFFSET, true);
  view.setUint32(22, 0, true); // 无后续 IFD

  // Exif SubIFD
  const entries = [
    { tag: 0x829a, type: 5, count: 1, data: [1, 125] }, // ExposureTime 1/125
    { tag: 0x829d, type: 5, count: 1, data: [71, 10] }, // FNumber 7.1
    { tag: 0x8827, type: 3, count: 1, data: [64] }, // ISO 64
    { tag: 0x9003, type: 2, count: 20, ascii: '2026:08:20 18:30:00' }, // DateTimeOriginal
    { tag: 0x920a, type: 5, count: 1, data: [48, 1] }, // FocalLength 48mm
  ];

  let cursor = EXIF_IFD_OFFSET;
  view.setUint16(cursor, entries.length, true);
  cursor += 2;

  let dataOffset = DATA_START;
  for (const entry of entries) {
    view.setUint16(cursor, entry.tag, true);
    view.setUint16(cursor + 2, entry.type, true);
    view.setUint32(cursor + 4, entry.count, true);
    if (entry.ascii !== undefined) {
      const bytes = new TextEncoder().encode(`${entry.ascii}\0`);
      buffer.set(bytes, dataOffset);
      view.setUint32(cursor + 8, dataOffset, true);
      dataOffset += bytes.length;
    } else if (entry.type === 3) {
      view.setUint16(cursor + 8, entry.data[0], true);
    } else {
      view.setUint32(cursor + 8, dataOffset, true);
      view.setUint32(dataOffset, entry.data[0], true);
      view.setUint32(dataOffset + 4, entry.data[1], true);
      dataOffset += 8;
    }
    cursor += 12;
  }
  view.setUint32(cursor, 0, true); // 无后续 IFD
  return buffer;
}

function buildApp1(tiff) {
  const payload = 6 + tiff.length; // "Exif\0\0" + TIFF
  const segment = new Uint8Array(2 + 2 + payload);
  const view = new DataView(segment.buffer);
  view.setUint16(0, 0xffe1, false);
  view.setUint16(2, 2 + payload, false);
  segment.set([0x45, 0x78, 0x69, 0x66, 0, 0], 4);
  segment.set(tiff, 10);
  return segment;
}

const base = await sharp({
  create: {
    width: 8,
    height: 8,
    channels: 3,
    background: { r: 120, g: 120, b: 120 },
  },
})
  .jpeg({ quality: 80 })
  .toBuffer();

const jpeg = new Uint8Array(base);
const app1 = buildApp1(buildTiff());
const outputBytes = new Uint8Array(jpeg.length + app1.length);
outputBytes.set(jpeg.slice(0, 2), 0); // SOI
outputBytes.set(app1, 2);
outputBytes.set(jpeg.slice(2), 2 + app1.length);

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, outputBytes);
console.log(
  `Wrote ${path.relative(projectRoot, output)} (${outputBytes.length} bytes)`,
);
