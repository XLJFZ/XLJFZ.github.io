export const MAX_PREVIEW_EDGE = 4096;

/** @param {{width: number, height: number}} image */
export function maximumPreviewWidth(image) {
  return Math.max(
    1,
    Math.floor(
      image.width *
        Math.min(1, MAX_PREVIEW_EDGE / Math.max(image.width, image.height)),
    ),
  );
}

/** @param {{width: number, height: number}} image */
export function previewWidths(image) {
  const maximum = maximumPreviewWidth(image);
  return [
    ...new Set([Math.min(1200, maximum), Math.min(1800, maximum), maximum]),
  ];
}
