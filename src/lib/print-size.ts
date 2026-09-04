export type Orientation = 'portrait' | 'landscape';

export type Paper = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
};

export const papers: Paper[] = [
  { id: 'a5', label: 'A5', widthMm: 148, heightMm: 210 },
  { id: 'a4', label: 'A4', widthMm: 210, heightMm: 297 },
  { id: 'a3', label: 'A3', widthMm: 297, heightMm: 420 },
  { id: 'a2', label: 'A2', widthMm: 420, heightMm: 594 },
  { id: 'a1', label: 'A1', widthMm: 594, heightMm: 841 },
  { id: 'a0', label: 'A0', widthMm: 841, heightMm: 1189 },
  { id: '4x6', label: '4 × 6 英寸', widthMm: 101.6, heightMm: 152.4 },
  { id: '5x7', label: '5 × 7 英寸', widthMm: 127, heightMm: 177.8 },
  { id: '8x10', label: '8 × 10 英寸', widthMm: 203.2, heightMm: 254 },
  { id: '12x18', label: '12 × 18 英寸', widthMm: 304.8, heightMm: 457.2 },
];

export function recommendedPrintDpi(paper: Paper) {
  const longEdge = Math.max(paper.widthMm, paper.heightMm);
  if (longEdge > 900) return 150;
  if (longEdge > 650) return 200;
  if (longEdge > 450) return 240;
  return 300;
}

const MM_PER_INCH = 25.4;

export function orientedPaper(paper: Paper, orientation: Orientation) {
  const short = Math.min(paper.widthMm, paper.heightMm);
  const long = Math.max(paper.widthMm, paper.heightMm);
  return orientation === 'portrait'
    ? { widthMm: short, heightMm: long }
    : { widthMm: long, heightMm: short };
}

export function calculatePrintFit({
  pixelWidth,
  pixelHeight,
  dpi,
  paper,
  orientation,
}: {
  pixelWidth: number;
  pixelHeight: number;
  dpi: number;
  paper: Paper;
  orientation: Orientation;
}) {
  const { widthMm: paperWidthMm, heightMm: paperHeightMm } = orientedPaper(
    paper,
    orientation,
  );
  const maxWidthMm = (pixelWidth / dpi) * MM_PER_INCH;
  const maxHeightMm = (pixelHeight / dpi) * MM_PER_INCH;
  const requiredWidth = Math.ceil((paperWidthMm / MM_PER_INCH) * dpi);
  const requiredHeight = Math.ceil((paperHeightMm / MM_PER_INCH) * dpi);
  const effectiveDpi = Math.min(
    (pixelWidth / paperWidthMm) * MM_PER_INCH,
    (pixelHeight / paperHeightMm) * MM_PER_INCH,
  );

  const imageRatio = pixelWidth / pixelHeight;
  const paperRatio = paperWidthMm / paperHeightMm;
  const containScale = Math.min(
    paperWidthMm / pixelWidth,
    paperHeightMm / pixelHeight,
  );
  const retainedWidthMm = pixelWidth * containScale;
  const retainedHeightMm = pixelHeight * containScale;
  const coverScale = Math.max(
    paperWidthMm / pixelWidth,
    paperHeightMm / pixelHeight,
  );
  const visiblePixelWidth = paperWidthMm / coverScale;
  const visiblePixelHeight = paperHeightMm / coverScale;
  const cropPercent =
    imageRatio > paperRatio
      ? 1 - visiblePixelWidth / pixelWidth
      : 1 - visiblePixelHeight / pixelHeight;

  return {
    maxWidthMm,
    maxHeightMm,
    paperWidthMm,
    paperHeightMm,
    requiredWidth,
    requiredHeight,
    effectiveDpi,
    hasEnoughPixels:
      pixelWidth >= requiredWidth && pixelHeight >= requiredHeight,
    needsCrop: cropPercent > 0.005,
    cropPercent: Math.max(0, cropPercent),
    cropAxis:
      imageRatio > paperRatio ? ('width' as const) : ('height' as const),
    retainedWidthMm,
    retainedHeightMm,
  };
}
