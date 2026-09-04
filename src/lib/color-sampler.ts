export type Rgb = { r: number; g: number; b: number };
export type PaletteColor = Rgb & { hex: string; ratio: number };
export type LightBalance = { dark: number; mid: number; light: number };
export type ColorSample = {
  palette: PaletteColor[];
  lightBalance: LightBalance;
  pixelCount: number;
};

type Bucket = Rgb & { count: number };

export function rgbToHex({ r, g, b }: Rgb) {
  return `#${[r, g, b]
    .map((value) => Math.round(value).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
}

function luminance({ r, g, b }: Rgb) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function analyzePixels(
  pixels: Uint8ClampedArray,
  paletteSize = 6,
): ColorSample {
  const buckets = new Map<number, Bucket>();
  const lightBalance = { dark: 0, mid: 0, light: 0 };
  let pixelCount = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 128) continue;
    const color = {
      r: pixels[index],
      g: pixels[index + 1],
      b: pixels[index + 2],
    };
    const key = ((color.r >> 4) << 8) | ((color.g >> 4) << 4) | (color.b >> 4);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
    bucket.r += color.r;
    bucket.g += color.g;
    bucket.b += color.b;
    bucket.count += 1;
    buckets.set(key, bucket);
    const value = luminance(color);
    if (value < 0.32) lightBalance.dark += 1;
    else if (value < 0.68) lightBalance.mid += 1;
    else lightBalance.light += 1;
    pixelCount += 1;
  }

  const palette = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, paletteSize)
    .map((bucket) => {
      const color = {
        r: Math.round(bucket.r / bucket.count),
        g: Math.round(bucket.g / bucket.count),
        b: Math.round(bucket.b / bucket.count),
      };
      return {
        ...color,
        hex: rgbToHex(color),
        ratio: bucket.count / pixelCount,
      };
    });

  return {
    palette,
    lightBalance: {
      dark: lightBalance.dark / pixelCount || 0,
      mid: lightBalance.mid / pixelCount || 0,
      light: lightBalance.light / pixelCount || 0,
    },
    pixelCount,
  };
}

export function combineSamples(
  samples: ColorSample[],
  paletteSize = 8,
): ColorSample {
  const pixels: number[] = [];
  for (const sample of samples) {
    for (const color of sample.palette) {
      const repeats = Math.max(
        1,
        Math.round((color.ratio * sample.pixelCount) / 64),
      );
      for (let index = 0; index < repeats; index += 1) {
        pixels.push(color.r, color.g, color.b, 255);
      }
    }
  }
  const combined = analyzePixels(new Uint8ClampedArray(pixels), paletteSize);
  const total = samples.reduce((sum, sample) => sum + sample.pixelCount, 0);
  combined.pixelCount = total;
  if (total) {
    combined.lightBalance = {
      dark:
        samples.reduce(
          (sum, sample) => sum + sample.lightBalance.dark * sample.pixelCount,
          0,
        ) / total,
      mid:
        samples.reduce(
          (sum, sample) => sum + sample.lightBalance.mid * sample.pixelCount,
          0,
        ) / total,
      light:
        samples.reduce(
          (sum, sample) => sum + sample.lightBalance.light * sample.pixelCount,
          0,
        ) / total,
    };
  }
  return combined;
}
