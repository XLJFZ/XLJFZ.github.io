export type QualityPreset = '宽松' | '推荐' | '严格';

export type QualityThresholds = {
  blurVariance: number;
  clippedRatio: number;
  minimumLongEdge: number;
  nearDuplicateDistance: number;
};

export const QUALITY_PRESETS: Record<QualityPreset, QualityThresholds> = {
  宽松: {
    blurVariance: 55,
    clippedRatio: 0.08,
    minimumLongEdge: 1600,
    nearDuplicateDistance: 5,
  },
  推荐: {
    blurVariance: 90,
    clippedRatio: 0.04,
    minimumLongEdge: 2400,
    nearDuplicateDistance: 7,
  },
  严格: {
    blurVariance: 140,
    clippedRatio: 0.02,
    minimumLongEdge: 3200,
    nearDuplicateDistance: 9,
  },
};

export function analyzePixels(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const gray = new Float32Array(width * height);
  let highlights = 0;
  let shadows = 0;
  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4;
    const value =
      rgba[offset] * 0.299 +
      rgba[offset + 1] * 0.587 +
      rgba[offset + 2] * 0.114;
    gray[index] = value;
    if (
      rgba[offset] >= 250 &&
      rgba[offset + 1] >= 250 &&
      rgba[offset + 2] >= 250
    )
      highlights += 1;
    if (rgba[offset] <= 5 && rgba[offset + 1] <= 5 && rgba[offset + 2] <= 5)
      shadows += 1;
  }

  let sum = 0;
  let sumSquares = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const laplacian =
        gray[i - width] +
        gray[i - 1] -
        4 * gray[i] +
        gray[i + 1] +
        gray[i + width];
      sum += laplacian;
      sumSquares += laplacian * laplacian;
      count += 1;
    }
  }
  const mean = count ? sum / count : 0;
  return {
    blurVariance: count ? sumSquares / count - mean * mean : 0,
    highlightRatio: highlights / Math.max(gray.length, 1),
    shadowRatio: shadows / Math.max(gray.length, 1),
    perceptualHash: differenceHash(gray, width, height),
  };
}

function differenceHash(gray: Float32Array, width: number, height: number) {
  let hash = BigInt(0);
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const row = Math.min(height - 1, Math.floor(((y + 0.5) * height) / 8));
      const left = Math.min(width - 1, Math.floor(((x + 0.25) * width) / 9));
      const right = Math.min(width - 1, Math.floor(((x + 1.25) * width) / 9));
      hash =
        (hash << BigInt(1)) |
        (gray[row * width + left] > gray[row * width + right]
          ? BigInt(1)
          : BigInt(0));
    }
  }
  return hash.toString(16).padStart(16, '0');
}

export function hammingDistance(left: string, right: string) {
  let value = BigInt(`0x${left || '0'}`) ^ BigInt(`0x${right || '0'}`);
  let distance = 0;
  while (value) {
    value &= value - BigInt(1);
    distance += 1;
  }
  return distance;
}

export function groupDuplicates<
  T extends { name: string; exactHash: string; perceptualHash?: string },
>(items: T[], nearDistance: number) {
  const exact = new Map<string, T[]>();
  for (const item of items) {
    if (!item.exactHash) continue;
    exact.set(item.exactHash, [...(exact.get(item.exactHash) ?? []), item]);
  }
  const exactGroups = [...exact.values()].filter((group) => group.length > 1);
  const parent = items.map((_, index) => index);
  const root = (i: number): number =>
    parent[i] === i ? i : (parent[i] = root(parent[i]));
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (
        items[i].exactHash === items[j].exactHash ||
        !items[i].perceptualHash ||
        !items[j].perceptualHash
      )
        continue;
      const leftHash = items[i].perceptualHash;
      const rightHash = items[j].perceptualHash;
      if (!leftHash || !rightHash) continue;
      if (hammingDistance(leftHash, rightHash) <= nearDistance)
        parent[root(j)] = root(i);
    }
  }
  const near = new Map<number, T[]>();
  items.forEach((item, index) =>
    near.set(root(index), [...(near.get(root(index)) ?? []), item]),
  );
  return {
    exactGroups,
    nearGroups: [...near.values()].filter((group) => group.length > 1),
  };
}

export function isQualityPhoto(file: Pick<File, 'name' | 'type'>) {
  return (
    /image\/(jpeg|png|webp|tiff)/i.test(file.type) ||
    /\.(jpe?g|png|webp|tiff?|dng|nef|arw|cr2|raf|3fr|fff)$/i.test(file.name)
  );
}

export function findEmbeddedJpeg(source: ArrayBuffer) {
  const bytes = new Uint8Array(source);
  let best: [number, number] | null = null;
  let start = -1;
  for (let index = 0; index < bytes.length - 1; index += 1) {
    if (bytes[index] === 0xff && bytes[index + 1] === 0xd8) start = index;
    if (start >= 0 && bytes[index] === 0xff && bytes[index + 1] === 0xd9) {
      const candidate: [number, number] = [start, index + 2];
      if (!best || candidate[1] - candidate[0] > best[1] - best[0])
        best = candidate;
      start = -1;
    }
  }
  return best;
}
