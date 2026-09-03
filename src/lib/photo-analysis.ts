import { effectiveFocalLength, type PhotoMetadata } from './photo-metadata.ts';

export type DistributionItem = {
  label: string;
  count: number;
  percentage: number;
};

export type PhotoRecord = {
  name: string;
  metadata: PhotoMetadata | null;
};

type Bucket = { label: string; matches: (value: number) => boolean };

const focalBuckets: Bucket[] = [
  { label: '≤20mm', matches: (value) => value <= 20 },
  { label: '21–34mm', matches: (value) => value > 20 && value < 35 },
  { label: '35–59mm', matches: (value) => value >= 35 && value < 60 },
  { label: '60–104mm', matches: (value) => value >= 60 && value < 105 },
  { label: '105–199mm', matches: (value) => value >= 105 && value < 200 },
  { label: '≥200mm', matches: (value) => value >= 200 },
];

const isoBuckets: Bucket[] = [
  { label: '≤100', matches: (value) => value <= 100 },
  { label: '125–400', matches: (value) => value > 100 && value <= 400 },
  { label: '500–800', matches: (value) => value > 400 && value <= 800 },
  { label: '1000–1600', matches: (value) => value > 800 && value <= 1600 },
  { label: '2000–3200', matches: (value) => value > 1600 && value <= 3200 },
  { label: '>3200', matches: (value) => value > 3200 },
];

const shutterBuckets: Bucket[] = [
  { label: '≥1s', matches: (value) => value >= 1 },
  { label: '1s–1/10s', matches: (value) => value < 1 && value >= 0.1 },
  {
    label: '1/10–1/60s',
    matches: (value) => value < 0.1 && value >= 1 / 60,
  },
  {
    label: '1/60–1/250s',
    matches: (value) => value < 1 / 60 && value >= 1 / 250,
  },
  { label: '<1/250s', matches: (value) => value < 1 / 250 },
];

const timeBuckets: Bucket[] = [
  { label: '深夜 0–5', matches: (value) => value <= 5 },
  { label: '上午 6–9', matches: (value) => value >= 6 && value <= 9 },
  { label: '中午 10–13', matches: (value) => value >= 10 && value <= 13 },
  { label: '下午 14–17', matches: (value) => value >= 14 && value <= 17 },
  { label: '傍晚 18–21', matches: (value) => value >= 18 && value <= 21 },
  { label: '夜间 22–23', matches: (value) => value >= 22 },
];

function distribution(values: number[], buckets: Bucket[]) {
  return buckets.map((bucket) => {
    const count = values.filter(bucket.matches).length;
    return {
      label: bucket.label,
      count,
      percentage: values.length ? count / values.length : 0,
    };
  });
}

function exactDistribution(
  values: number[],
  formatter: (value: number) => string,
) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const label = formatter(value);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percentage: values.length ? count / values.length : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);
}

export function analyzePhotos(records: PhotoRecord[]) {
  const metadata = records
    .map((record) => record.metadata)
    .filter((item): item is PhotoMetadata => item !== null);
  const focalLengths = metadata
    .map(effectiveFocalLength)
    .filter((value): value is number => typeof value === 'number');
  const apertures = metadata
    .map((item) => item.aperture)
    .filter((value): value is number => typeof value === 'number');
  const isoValues = metadata
    .map((item) => item.iso)
    .filter((value): value is number => typeof value === 'number');
  const shutterValues = metadata
    .map((item) => item.exposureTime)
    .filter((value): value is number => typeof value === 'number');
  const hours = metadata
    .map((item) => item.capturedAt?.match(/(?:^|\s)(\d{2}):\d{2}:\d{2}/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map(Number);

  return {
    total: records.length,
    readable: metadata.length,
    focalCount: focalLengths.length,
    apertureCount: apertures.length,
    isoCount: isoValues.length,
    shutterCount: shutterValues.length,
    timeCount: hours.length,
    focalLengths,
    focal: distribution(focalLengths, focalBuckets),
    aperture: exactDistribution(apertures, (value) => `f/${value.toFixed(1)}`),
    iso: distribution(isoValues, isoBuckets),
    shutter: distribution(shutterValues, shutterBuckets),
    time: distribution(hours, timeBuckets),
  };
}

export function evaluateLensNeed(
  focalLengths: number[],
  lens: { label: string; min: number; max: number },
) {
  const lower = Math.min(lens.min, lens.max);
  const upper = Math.max(lens.min, lens.max);
  const inRange = focalLengths.filter(
    (value) => value >= lower && value <= upper,
  ).length;
  const ratio = focalLengths.length ? inRange / focalLengths.length : 0;
  if (focalLengths.length < 12) {
    return {
      tone: 'insufficient' as const,
      verdict: '样本还不够，先别急着买',
      detail: `只有 ${focalLengths.length} 张照片带有可用焦段。建议至少分析 12 张，最好覆盖几次不同拍摄。`,
      inRange,
      ratio,
    };
  }
  if (ratio >= 0.35) {
    return {
      tone: 'strong' as const,
      verdict: `${lens.label} 值得进入购买候选`,
      detail: `${inRange} 张照片落在这段，占可用样本的 ${(ratio * 100).toFixed(0)}%。你的真实使用频率提供了较强支持。`,
      inRange,
      ratio,
    };
  }
  if (ratio >= 0.18) {
    return {
      tone: 'medium' as const,
      verdict: `${lens.label} 有用，但更适合先租后买`,
      detail: `${inRange} 张照片落在这段，占 ${(ratio * 100).toFixed(0)}%。需求存在，但还不足以只凭焦段统计直接下单。`,
      inRange,
      ratio,
    };
  }
  return {
    tone: 'weak' as const,
    verdict: `${lens.label} 暂时不像刚需`,
    detail: `只有 ${inRange} 张照片落在这段，占 ${(ratio * 100).toFixed(0)}%。除非你准备主动改变题材，否则现有习惯对购买支持较弱。`,
    inRange,
    ratio,
  };
}
