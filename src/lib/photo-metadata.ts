export type PhotoMetadata = {
  focalLength?: number;
  focalLength35mm?: number;
  aperture?: number;
  iso?: number;
  exposureTime?: number;
  capturedAt?: string;
  cameraModel?: string;
  lensModel?: string;
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

function firstNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    const first = value.find(
      (item) => typeof item === 'number' && Number.isFinite(item),
    );
    return typeof first === 'number' ? first : undefined;
  }
  return undefined;
}

function readValue(
  view: DataView,
  tiffStart: number,
  entryOffset: number,
  littleEndian: boolean,
) {
  const type = view.getUint16(entryOffset + 2, littleEndian);
  const count = view.getUint32(entryOffset + 4, littleEndian);
  const size = TYPE_SIZES[type];
  if (!size || count > 4096) return undefined;

  const byteLength = size * count;
  const valueOffset =
    byteLength <= 4
      ? entryOffset + 8
      : tiffStart + view.getUint32(entryOffset + 8, littleEndian);
  if (valueOffset < 0 || valueOffset + byteLength > view.byteLength) {
    return undefined;
  }

  if (type === 2) {
    const bytes = new Uint8Array(
      view.buffer,
      view.byteOffset + valueOffset,
      byteLength,
    );
    const decoded = new TextDecoder('ascii').decode(bytes);
    const terminator = decoded.indexOf(String.fromCharCode(0));
    return (terminator >= 0 ? decoded.slice(0, terminator) : decoded).trim();
  }

  const values: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const offset = valueOffset + index * size;
    if (type === 1 || type === 7) values.push(view.getUint8(offset));
    if (type === 3) values.push(view.getUint16(offset, littleEndian));
    if (type === 4) values.push(view.getUint32(offset, littleEndian));
    if (type === 9) values.push(view.getInt32(offset, littleEndian));
    if (type === 5 || type === 10) {
      const numerator =
        type === 5
          ? view.getUint32(offset, littleEndian)
          : view.getInt32(offset, littleEndian);
      const denominator =
        type === 5
          ? view.getUint32(offset + 4, littleEndian)
          : view.getInt32(offset + 4, littleEndian);
      values.push(denominator ? numerator / denominator : 0);
    }
  }
  return values.length === 1 ? values[0] : values;
}

function findTiffStart(view: DataView) {
  if (view.byteLength < 8) return null;
  const first = view.getUint8(0);
  const second = view.getUint8(1);
  if (
    (first === 0x49 && second === 0x49) ||
    (first === 0x4d && second === 0x4d)
  ) {
    return 0;
  }

  if (first !== 0xff || second !== 0xd8) return null;
  let offset = 2;
  while (offset + 12 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    if (marker === 0xda || marker === 0xd9) break;
    const length = view.getUint16(offset + 2, false);
    if (length < 2 || offset + length + 2 > view.byteLength) break;
    const isExif =
      marker === 0xe1 &&
      view.getUint8(offset + 4) === 0x45 &&
      view.getUint8(offset + 5) === 0x78 &&
      view.getUint8(offset + 6) === 0x69 &&
      view.getUint8(offset + 7) === 0x66 &&
      view.getUint8(offset + 8) === 0 &&
      view.getUint8(offset + 9) === 0;
    if (isExif) return offset + 10;
    offset += length + 2;
  }
  return null;
}

export function parsePhotoMetadata(source: ArrayBuffer): PhotoMetadata | null {
  const view = new DataView(source);
  const tiffStart = findTiffStart(view);
  if (tiffStart === null || tiffStart + 8 > view.byteLength) return null;

  const byteOrder = view.getUint16(tiffStart, false);
  const littleEndian = byteOrder === 0x4949;
  if (!littleEndian && byteOrder !== 0x4d4d) return null;
  if (view.getUint16(tiffStart + 2, littleEndian) !== 42) return null;

  const fields = new Map<number, unknown>();
  const visited = new Set<number>();
  const readIfd = (relativeOffset: number) => {
    const ifdOffset = tiffStart + relativeOffset;
    if (
      visited.has(ifdOffset) ||
      ifdOffset < tiffStart ||
      ifdOffset + 2 > view.byteLength
    ) {
      return;
    }
    visited.add(ifdOffset);
    const count = Math.min(view.getUint16(ifdOffset, littleEndian), 512);
    for (let index = 0; index < count; index += 1) {
      const entryOffset = ifdOffset + 2 + index * 12;
      if (entryOffset + 12 > view.byteLength) break;
      const tag = view.getUint16(entryOffset, littleEndian);
      const value = readValue(view, tiffStart, entryOffset, littleEndian);
      if (value !== undefined && !fields.has(tag)) fields.set(tag, value);
      if (tag === 0x8769 || tag === 0x014a) {
        const offsets = Array.isArray(value) ? value : [value];
        for (const offset of offsets) {
          if (typeof offset === 'number') readIfd(offset);
        }
      }
    }
  };

  const firstIfd = view.getUint32(tiffStart + 4, littleEndian);
  readIfd(firstIfd);

  const focalLength = firstNumber(fields.get(0x920a));
  const focalLength35mm = firstNumber(fields.get(0xa405));
  const aperture = firstNumber(fields.get(0x829d));
  const iso = firstNumber(fields.get(0x8827));
  const exposureTime = firstNumber(fields.get(0x829a));
  const capturedAt = fields.get(0x9003);
  const cameraModel = fields.get(0x0110);
  const lensModel = fields.get(0xa434);

  const metadata: PhotoMetadata = {
    ...(focalLength ? { focalLength } : {}),
    ...(focalLength35mm ? { focalLength35mm } : {}),
    ...(aperture ? { aperture } : {}),
    ...(iso ? { iso } : {}),
    ...(exposureTime ? { exposureTime } : {}),
    ...(typeof capturedAt === 'string' ? { capturedAt } : {}),
    ...(typeof cameraModel === 'string' ? { cameraModel } : {}),
    ...(typeof lensModel === 'string' ? { lensModel } : {}),
  };
  return Object.keys(metadata).length ? metadata : null;
}

export function effectiveFocalLength(metadata: PhotoMetadata) {
  return metadata.focalLength35mm ?? metadata.focalLength;
}

export function isSupportedPhotoFile(file: Pick<File, 'name' | 'type'>) {
  return (
    /image\/(jpeg|tiff)/i.test(file.type) ||
    /\.(jpe?g|tiff?|dng|nef|arw|cr2)$/i.test(file.name)
  );
}
