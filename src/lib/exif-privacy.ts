export type PrivacyCategory =
  | 'location'
  | 'serial'
  | 'owner'
  | 'time'
  | 'notes';

export type PrivacyFinding = {
  category: PrivacyCategory;
  label: string;
  value: string;
};

const SUPPORTED_PHOTO = /\.(jpe?g|jxl|hei[cf]|avif|webp|tiff?)$/i;

export function isSupportedPrivacyPhoto(file: Pick<File, 'name' | 'type'>) {
  return (
    SUPPORTED_PHOTO.test(file.name) ||
    /image\/(jpeg|jxl|heic|heif|avif|webp|tiff)/i.test(file.type)
  );
}

export function hasCompressedJxlExif(source: ArrayBuffer) {
  const bytes = new Uint8Array(source);
  const signature = [0x62, 0x72, 0x6f, 0x62, 0x45, 0x78, 0x69, 0x66];
  for (let offset = 0; offset + signature.length <= bytes.length; offset += 1) {
    if (signature.every((value, index) => bytes[offset + index] === value))
      return true;
  }
  return false;
}

type Entry = {
  tag: number;
  type: number;
  count: number;
  entryOffset: number;
  valueOffset: number;
  byteLength: number;
  littleEndian: boolean;
};

const TYPE_SIZES: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  7: 1,
  9: 4,
  10: 8,
};

const TAGS: Record<number, { category: PrivacyCategory; label: string }> = {
  0x010e: { category: 'notes', label: '图片描述' },
  0x0131: { category: 'notes', label: '处理软件' },
  0x0132: { category: 'time', label: '修改时间' },
  0x013b: { category: 'owner', label: '作者 / 艺术家' },
  0x013c: { category: 'notes', label: '处理设备' },
  0x8298: { category: 'owner', label: '版权信息' },
  0x9003: { category: 'time', label: '原始拍摄时间' },
  0x9004: { category: 'time', label: '数字化时间' },
  0x9010: { category: 'time', label: '时区' },
  0x9011: { category: 'time', label: '原始时间时区' },
  0x9012: { category: 'time', label: '数字化时间时区' },
  0x927c: { category: 'serial', label: '厂商私有信息' },
  0x9286: { category: 'notes', label: '用户备注' },
  0x9290: { category: 'time', label: '修改时间小数秒' },
  0x9291: { category: 'time', label: '拍摄时间小数秒' },
  0x9292: { category: 'time', label: '数字化时间小数秒' },
  0x9c9b: { category: 'notes', label: 'Windows 标题' },
  0x9c9c: { category: 'notes', label: 'Windows 备注' },
  0x9c9d: { category: 'owner', label: 'Windows 作者' },
  0x9c9e: { category: 'notes', label: 'Windows 关键词' },
  0x9c9f: { category: 'notes', label: 'Windows 主题' },
  0xa420: { category: 'serial', label: '图片唯一 ID' },
  0xa430: { category: 'owner', label: '相机所有者' },
  0xa431: { category: 'serial', label: '机身序列号' },
  0xa435: { category: 'serial', label: '镜头序列号' },
  0xc62f: { category: 'serial', label: '相机序列号' },
  0x10007: { category: 'time', label: 'GPS 时间' },
  0x1001d: { category: 'time', label: 'GPS 日期' },
};

function findJpegExif(bytes: Uint8Array) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return undefined;
  let offset = 2;
  while (offset + 12 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2 || offset + 2 + length > bytes.length) break;
    if (
      marker === 0xe1 &&
      bytes[offset + 4] === 0x45 &&
      bytes[offset + 5] === 0x78 &&
      bytes[offset + 6] === 0x69 &&
      bytes[offset + 7] === 0x66 &&
      bytes[offset + 8] === 0 &&
      bytes[offset + 9] === 0
    ) {
      return offset + 10;
    }
    offset += 2 + length;
  }
  return undefined;
}

function findTiffStarts(bytes: Uint8Array) {
  const jpeg = findJpegExif(bytes);
  if (jpeg !== undefined) return [jpeg];

  const starts: number[] = [];
  for (let offset = 0; offset + 8 <= bytes.length; offset += 1) {
    const littleEndian =
      bytes[offset] === 0x49 &&
      bytes[offset + 1] === 0x49 &&
      bytes[offset + 2] === 0x2a &&
      bytes[offset + 3] === 0;
    const bigEndian =
      bytes[offset] === 0x4d &&
      bytes[offset + 1] === 0x4d &&
      bytes[offset + 2] === 0 &&
      bytes[offset + 3] === 0x2a;
    if (littleEndian || bigEndian) starts.push(offset);
    if (starts.length >= 8) break;
  }
  return starts;
}

function entriesAt(bytes: Uint8Array, tiffStart: number) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const order = view.getUint16(tiffStart, false);
  const littleEndian = order === 0x4949;
  if (
    (!littleEndian && order !== 0x4d4d) ||
    view.getUint16(tiffStart + 2, littleEndian) !== 42
  ) {
    return {
      entries: [] as Entry[],
      gpsPointers: [] as Entry[],
    };
  }
  const result: Entry[] = [];
  const visited = new Set<number>();
  const gpsPointers: Entry[] = [];

  const readIfd = (relativeOffset: number, isGps = false) => {
    const offset = tiffStart + relativeOffset;
    if (visited.has(offset) || offset < tiffStart || offset + 2 > bytes.length)
      return;
    visited.add(offset);
    const count = Math.min(view.getUint16(offset, littleEndian), 1024);
    for (let index = 0; index < count; index += 1) {
      const entryOffset = offset + 2 + index * 12;
      if (entryOffset + 12 > bytes.length) break;
      const tag = view.getUint16(entryOffset, littleEndian);
      const type = view.getUint16(entryOffset + 2, littleEndian);
      const valueCount = view.getUint32(entryOffset + 4, littleEndian);
      const size = TYPE_SIZES[type];
      if (!size || valueCount > 1_000_000) continue;
      const byteLength = size * valueCount;
      const valueOffset =
        byteLength <= 4
          ? entryOffset + 8
          : tiffStart + view.getUint32(entryOffset + 8, littleEndian);
      if (valueOffset < tiffStart || valueOffset + byteLength > bytes.length)
        continue;
      const entry = {
        tag,
        type,
        count: valueCount,
        entryOffset,
        valueOffset,
        byteLength,
        littleEndian,
      };
      result.push(isGps ? { ...entry, tag: 0x10000 + tag } : entry);
      if (tag === 0x8769 || tag === 0xa005 || tag === 0x014a) {
        readIfd(view.getUint32(entryOffset + 8, littleEndian));
      }
      if (tag === 0x8825) {
        gpsPointers.push(entry);
        readIfd(view.getUint32(entryOffset + 8, littleEndian), true);
      }
    }
    const nextOffsetPosition = offset + 2 + count * 12;
    if (!isGps && nextOffsetPosition + 4 <= bytes.length) {
      const next = view.getUint32(nextOffsetPosition, littleEndian);
      if (next) readIfd(next);
    }
  };
  readIfd(view.getUint32(tiffStart + 4, littleEndian));
  return { entries: result, gpsPointers };
}

function entries(bytes: Uint8Array) {
  const result: Entry[] = [];
  const gpsPointers: Entry[] = [];
  for (const tiffStart of findTiffStarts(bytes)) {
    const parsed = entriesAt(bytes, tiffStart);
    result.push(...parsed.entries);
    gpsPointers.push(...parsed.gpsPointers);
  }
  return { entries: result, gpsPointers };
}

function valueOf(bytes: Uint8Array, entry: Entry) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (entry.type === 2) {
    return new TextDecoder('ascii')
      .decode(
        bytes.slice(entry.valueOffset, entry.valueOffset + entry.byteLength),
      )
      .replaceAll(String.fromCharCode(0), '')
      .trim();
  }
  if (entry.type === 3 && entry.count === 1)
    return String(view.getUint16(entry.valueOffset, entry.littleEndian));
  if (entry.type === 4 && entry.count === 1)
    return String(view.getUint32(entry.valueOffset, entry.littleEndian));
  return entry.byteLength ? '已记录' : '';
}

function gpsSummary(bytes: Uint8Array, gpsEntries: Entry[]) {
  const base = new Map(gpsEntries.map((entry) => [entry.tag - 0x10000, entry]));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const coordinate = (tag: number) => {
    const entry = base.get(tag);
    if (!entry || entry.type !== 5 || entry.count < 3) return undefined;
    const values = [0, 1, 2].map((index) => {
      const offset = entry.valueOffset + index * 8;
      const denominator = view.getUint32(offset + 4, entry.littleEndian);
      return denominator
        ? view.getUint32(offset, entry.littleEndian) / denominator
        : 0;
    });
    return values[0] + values[1] / 60 + values[2] / 3600;
  };
  const lat = coordinate(2);
  const lon = coordinate(4);
  return lat !== undefined && lon !== undefined
    ? `${lat.toFixed(5)}, ${lon.toFixed(5)}`
    : '已记录位置数据';
}

export function inspectExifPrivacy(source: ArrayBuffer): PrivacyFinding[] {
  const bytes = new Uint8Array(source);
  const parsed = entries(bytes);
  const findings: PrivacyFinding[] = [];
  const gpsEntries = parsed.entries.filter((entry) => entry.tag >= 0x10000);
  if (parsed.gpsPointers.length && gpsEntries.length) {
    findings.push({
      category: 'location',
      label: 'GPS 位置',
      value: gpsSummary(bytes, gpsEntries),
    });
  }
  for (const entry of parsed.entries) {
    const info = TAGS[entry.tag];
    if (!info) continue;
    const value = valueOf(bytes, entry);
    if (value) findings.push({ ...info, value });
  }
  return findings.filter(
    (finding, index) =>
      findings.findIndex(
        (other) =>
          other.category === finding.category &&
          other.label === finding.label &&
          other.value === finding.value,
      ) === index,
  );
}

function eraseEntry(bytes: Uint8Array, entry: Entry) {
  bytes.fill(0, entry.valueOffset, entry.valueOffset + entry.byteLength);
  bytes.fill(0, entry.entryOffset, entry.entryOffset + 12);
}

export function cleanExifPrivacy(
  source: ArrayBuffer,
  selected: Set<PrivacyCategory>,
) {
  const bytes = new Uint8Array(source.slice(0));
  const parsed = entries(bytes);
  if (selected.has('location') && parsed.gpsPointers.length) {
    for (const entry of parsed.entries.filter((item) => item.tag >= 0x10000))
      eraseEntry(bytes, entry);
    for (const pointer of parsed.gpsPointers) eraseEntry(bytes, pointer);
  }
  for (const entry of parsed.entries) {
    const info = TAGS[entry.tag];
    if (info && selected.has(info.category)) eraseEntry(bytes, entry);
  }
  return bytes;
}
