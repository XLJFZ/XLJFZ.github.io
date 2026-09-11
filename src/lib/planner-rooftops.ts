/** Project real Mercator XYZ coordinates with the map's current camera matrix. */
export function projectElevatedPoint(
  matrix: ArrayLike<number>,
  point: { x: number; y: number; z: number },
  width: number,
  height: number,
) {
  const { x, y, z } = point;
  const w = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
  if (w <= 0) return null;
  const clipX = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
  const clipY = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
  return {
    x: ((clipX / w + 1) * width) / 2,
    y: ((1 - clipY / w) * height) / 2,
  };
}

/** Choose an interior roof point, including concave footprints and courtyards. */
export function roofInteriorPoint(rings: number[][][]) {
  const outer = rings[0];
  if (!outer?.length) return null;
  const ys = [...new Set(outer.map((point) => point[1]))].sort((a, b) => a - b);
  let best: { lng: number; lat: number; span: number } | null = null;
  for (let row = 1; row < ys.length; row++) {
    const lat = (ys[row - 1] + ys[row]) / 2;
    const crossings: number[] = [];
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[j],
          b = ring[i];
        if (a[1] > lat !== b[1] > lat)
          crossings.push(a[0] + ((lat - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const span = crossings[i + 1] - crossings[i];
      if (!best || span > best.span)
        best = { lng: (crossings[i] + crossings[i + 1]) / 2, lat, span };
    }
  }
  return best ? { lng: best.lng, lat: best.lat } : null;
}

export function roofHeight(properties: Record<string, unknown>) {
  // Use the rendered building height, never fabricate heights from a default.
  const raw = properties.render_height ?? properties.height;
  if (typeof raw !== 'number' && typeof raw !== 'string') return null;
  if (raw === '') return null;
  const height = Number(raw);
  return Number.isFinite(height) && height > 0 ? height : null;
}
