export type Point = { lat: number; lng: number };

export function sightlineGeometry(
  distance: number,
  cameraHeight: number,
  subjectHeight: number,
) {
  const difference = subjectHeight - cameraHeight;
  return {
    difference,
    distance: Math.hypot(distance, difference),
    angle: (Math.atan2(difference, distance) * 180) / Math.PI,
  };
}

export const sensorWidths = {
  fullFrame: { label: '全画幅', width: 36 },
  apsc: { label: 'APS-C · 1.5×', width: 24 },
  canonApsc: { label: 'APS-C · 1.6×', width: 22.3 },
  mft: { label: 'M4/3 · 2×', width: 17.3 },
} as const;

export type SensorKey = keyof typeof sensorWidths;

export function horizontalFov(sensorWidth: number, focalLength: number) {
  return (2 * Math.atan(sensorWidth / (2 * focalLength)) * 180) / Math.PI;
}

export function sceneWidthAtDistance(distance: number, fov: number) {
  return 2 * distance * Math.tan((fov * Math.PI) / 360);
}

export function requiredFocalLength(
  sensorWidth: number,
  distance: number,
  subjectWidth: number,
) {
  return (sensorWidth * distance) / subjectWidth;
}

export function distanceMeters(a: Point, b: Point) {
  const earthRadius = 6_371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

export function bearingDegrees(from: Point, to: Point) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const y = Math.sin(deltaLng) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function angularDifference(a: number, b: number) {
  return Math.abs(((a - b + 540) % 360) - 180);
}

export function classifyLight(
  sunAzimuth: number,
  subjectToCameraBearing: number,
  sunAltitude: number,
) {
  if (sunAltitude <= -6) return { label: '夜间', detail: '太阳位于地平线下' };
  if (sunAltitude <= 0)
    return { label: '蓝调', detail: '环境光柔和，立面直射光很弱' };
  const difference = angularDifference(sunAzimuth, subjectToCameraBearing);
  if (difference <= 35)
    return { label: '顺光', detail: '太阳在机位一侧，立面受光均匀' };
  if (difference <= 120)
    return { label: '侧光', detail: '轮廓与材质更容易形成层次' };
  return { label: '逆光', detail: '太阳在被摄物后方，注意动态范围' };
}

export function classifyFacadeIllumination(
  sunAzimuth: number,
  facadeBearing: number,
  sunAltitude: number,
) {
  if (sunAltitude <= 0) return { label: '无直射', detail: '太阳位于地平线下' };
  const difference = angularDifference(sunAzimuth, facadeBearing);
  if (difference <= 55)
    return { label: '立面受光', detail: '太阳正照向这片立面' };
  if (difference <= 115)
    return { label: '立面擦光', detail: '光线沿立面掠过，纹理更明显' };
  return { label: '立面背光', detail: '这片立面没有直接日照' };
}

export function destinationPoint(
  origin: Point,
  bearing: number,
  meters: number,
) {
  const radius = 6_371_000;
  const angular = meters / radius;
  const bearingRad = (bearing * Math.PI) / 180;
  const lat1 = (origin.lat * Math.PI) / 180;
  const lng1 = (origin.lng * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(bearingRad),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
}

export function formatBearing(value: number) {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const direction = directions[Math.round(value / 45) % 8];
  return `${direction} ${Math.round(value)}°`;
}
