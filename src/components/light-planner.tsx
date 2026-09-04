'use client';

import 'maplibre-gl/dist/maplibre-gl.css';

import {
  Building2,
  Camera,
  Compass,
  Download,
  Layers2,
  LocateFixed,
  Mountain,
  Moon,
  Search,
  Sun,
} from 'lucide-react';
import { type SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import * as SunCalc from 'suncalc';

import { Button } from '@/components/ui/button';
import {
  bearingDegrees,
  classifyFacadeIllumination,
  classifyLight,
  destinationPoint,
  distanceMeters,
  formatBearing,
  horizontalFov,
  requiredFocalLength,
  sceneWidthAtDistance,
  sensorWidths,
  type Point,
  type SensorKey,
} from '@/lib/shoot-planner';

const initialCamera = { lat: 31.2323, lng: 121.4667 };
const initialSubject = { lat: 31.2332, lng: 121.4682 };
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

type PlacementMode = 'camera' | 'subject';
type MapMode = '2d' | '3d';
function pad(value: number) {
  return String(value).padStart(2, '0');
}

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function dateAtZone(date: string, minutes: number, offsetHours: number) {
  const [year, month, day] = date.split('-').map(Number);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return new Date(Date.UTC(year, month - 1, day, hours - offsetHours, mins));
}

function formatTime(value: Date | null | undefined, offsetHours: number) {
  if (!value || Number.isNaN(value.getTime())) return '—';
  const shifted = new Date(value.getTime() + offsetHours * 3_600_000);
  return `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

function formatSliderTime(minutes: number) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

function minutesAtZone(value: Date | null | undefined, offsetHours: number) {
  if (!value || Number.isNaN(value.getTime())) return null;
  const shifted = new Date(value.getTime() + offsetHours * 3_600_000);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

function bearingPoint(bearing: number, radius: number, center = 150) {
  const radians = ((bearing - 90) * Math.PI) / 180;
  return {
    x: center + Math.cos(radians) * radius,
    y: center + Math.sin(radians) * radius,
  };
}

function CompassPlot({
  sunAzimuth,
  moonAzimuth,
  cameraBearing,
  fov,
  sunAltitude,
  moonAltitude,
}: {
  sunAzimuth: number;
  moonAzimuth: number;
  cameraBearing: number;
  fov: number;
  sunAltitude: number;
  moonAltitude: number;
}) {
  const sun = bearingPoint(sunAzimuth, 112);
  const moon = bearingPoint(moonAzimuth, 112);
  const subject = bearingPoint(cameraBearing, 83);
  const left = bearingPoint(cameraBearing - fov / 2, 94);
  const right = bearingPoint(cameraBearing + fov / 2, 94);
  return (
    <svg
      viewBox="0 0 300 300"
      className="mx-auto aspect-square w-full max-w-[330px]"
      aria-label="太阳、月亮与拍摄方向罗盘"
    >
      <defs>
        <radialGradient id="compassGlow">
          <stop offset="0" stopColor="#d8c19b" stopOpacity=".08" />
          <stop offset="1" stopColor="#d8c19b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="150" cy="150" r="142" fill="url(#compassGlow)" />
      {[40, 82, 122].map((radius) => (
        <circle
          key={radius}
          cx="150"
          cy="150"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,.1)"
          strokeWidth="1"
        />
      ))}
      {[0, 45, 90, 135].map((angle) => {
        const a = bearingPoint(angle, 122);
        const b = bearingPoint(angle + 180, 122);
        return (
          <line
            key={angle}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="rgba(255,255,255,.08)"
          />
        );
      })}
      <path
        d={`M150 150 L${left.x} ${left.y} A94 94 0 0 1 ${right.x} ${right.y} Z`}
        fill="rgba(216,193,155,.14)"
        stroke="rgba(216,193,155,.48)"
      />
      <line
        x1="150"
        y1="150"
        x2={subject.x}
        y2={subject.y}
        stroke="#f3ead9"
        strokeWidth="2"
      />
      <circle cx="150" cy="150" r="7" fill="#f3ead9" />
      <circle cx={subject.x} cy={subject.y} r="6" fill="#b5aea0" />
      <line
        x1="150"
        y1="150"
        x2={sun.x}
        y2={sun.y}
        stroke="#f0b95b"
        strokeWidth="1.5"
        strokeDasharray="4 5"
      />
      <circle cx={sun.x} cy={sun.y} r="9" fill="#f0b95b" />
      <line
        x1="150"
        y1="150"
        x2={moon.x}
        y2={moon.y}
        stroke="#9bb9d7"
        strokeWidth="1.5"
        strokeDasharray="4 5"
      />
      <circle cx={moon.x} cy={moon.y} r="7" fill="#9bb9d7" />
      {[
        ['北', 150, 15],
        ['东', 285, 154],
        ['南', 150, 294],
        ['西', 15, 154],
      ].map(([label, x, y]) => (
        <text
          key={label}
          x={x}
          y={y}
          textAnchor="middle"
          fill="rgba(255,255,255,.38)"
          fontSize="11"
        >
          {label}
        </text>
      ))}
      <text
        x={sun.x}
        y={sun.y + 24}
        textAnchor="middle"
        fill="#f0b95b"
        fontSize="10"
      >
        日 {sunAltitude.toFixed(0)}°
      </text>
      <text
        x={moon.x}
        y={moon.y - 14}
        textAnchor="middle"
        fill="#9bb9d7"
        fontSize="10"
      >
        月 {moonAltitude.toFixed(0)}°
      </text>
    </svg>
  );
}

export function LightPlanner() {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('maplibre-gl').Map | null>(null);
  const cameraMarker = useRef<import('maplibre-gl').Marker | null>(null);
  const subjectMarker = useRef<import('maplibre-gl').Marker | null>(null);
  const [cameraPoint, setCameraPoint] = useState<Point>(initialCamera);
  const [subjectPoint, setSubjectPoint] = useState<Point>(initialSubject);
  const [placement, setPlacement] = useState<PlacementMode>('camera');
  const [date, setDate] = useState(todayString);
  const [minutes, setMinutes] = useState(17 * 60 + 30);
  const [timezone, setTimezone] = useState(8);
  const [sensor, setSensor] = useState<SensorKey>('fullFrame');
  const [focalLength, setFocalLength] = useState(24);
  const [subjectWidth, setSubjectWidth] = useState(35);
  const [placeName, setPlaceName] = useState('上海 · 待勘察机位');
  const [mapReady, setMapReady] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('2d');
  const [facadeBearing, setFacadeBearing] = useState(() =>
    bearingDegrees(initialSubject, initialCamera),
  );
  const [query, setQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [geoError, setGeoError] = useState('');
  const [mapError, setMapError] = useState('');

  const instant = useMemo(
    () => dateAtZone(date, minutes, timezone),
    [date, minutes, timezone],
  );
  const sunPosition = useMemo(
    () => SunCalc.getPosition(instant, cameraPoint.lat, cameraPoint.lng),
    [instant, cameraPoint],
  );
  const moonPosition = useMemo(
    () => SunCalc.getMoonPosition(instant, cameraPoint.lat, cameraPoint.lng),
    [instant, cameraPoint],
  );
  const moonLight = useMemo(
    () => SunCalc.getMoonIllumination(instant),
    [instant],
  );
  const sunTimes = useMemo(
    () =>
      SunCalc.getTimes(
        dateAtZone(date, 12 * 60, timezone),
        cameraPoint.lat,
        cameraPoint.lng,
      ),
    [date, timezone, cameraPoint],
  );
  const moonTimes = useMemo(
    () =>
      SunCalc.getMoonTimes(
        dateAtZone(date, 0, timezone),
        cameraPoint.lat,
        cameraPoint.lng,
      ),
    [date, timezone, cameraPoint],
  );
  const distance = useMemo(
    () => distanceMeters(cameraPoint, subjectPoint),
    [cameraPoint, subjectPoint],
  );
  const cameraBearing = useMemo(
    () => bearingDegrees(cameraPoint, subjectPoint),
    [cameraPoint, subjectPoint],
  );
  const cameraSideBearing = useMemo(
    () => bearingDegrees(subjectPoint, cameraPoint),
    [cameraPoint, subjectPoint],
  );
  const fov = horizontalFov(sensorWidths[sensor].width, focalLength);
  const coverage = sceneWidthAtDistance(distance, fov);
  const requiredFocal = requiredFocalLength(
    sensorWidths[sensor].width,
    Math.max(distance, 1),
    subjectWidth,
  );
  const isWideEnough = coverage >= subjectWidth;
  const light = classifyLight(
    sunPosition.azimuth,
    cameraSideBearing,
    sunPosition.altitude,
  );
  const facadeLight = classifyFacadeIllumination(
    sunPosition.azimuth,
    facadeBearing,
    sunPosition.altitude,
  );

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;
    void import('maplibre-gl').then((module) => {
      if (cancelled || !mapNode.current) return;
      const maplibregl = module;
      const map = new maplibregl.Map({
        container: mapNode.current,
        style: MAP_STYLE,
        center: [121.4675, 31.2327],
        zoom: 15,
        attributionControl: false,
      });
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: true }),
        'top-right',
      );
      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-right',
      );
      resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(mapNode.current);
      requestAnimationFrame(() => map.resize());

      const makeMarker = (kind: PlacementMode) => {
        const element = document.createElement('div');
        element.className = `planner-marker planner-marker-${kind}`;
        element.textContent = kind === 'camera' ? '机' : '景';
        element.setAttribute(
          'aria-label',
          kind === 'camera' ? '机位标记' : '被摄物标记',
        );
        return element;
      };
      const camera = new maplibregl.Marker({
        element: makeMarker('camera'),
        draggable: true,
      })
        .setLngLat([initialCamera.lng, initialCamera.lat])
        .addTo(map);
      const subject = new maplibregl.Marker({
        element: makeMarker('subject'),
        draggable: true,
      })
        .setLngLat([initialSubject.lng, initialSubject.lat])
        .addTo(map);
      camera.on('dragend', () => {
        const point = camera.getLngLat();
        setCameraPoint({ lat: point.lat, lng: point.lng });
      });
      subject.on('dragend', () => {
        const point = subject.getLngLat();
        setSubjectPoint({ lat: point.lat, lng: point.lng });
      });
      map.on('click', (event: import('maplibre-gl').MapMouseEvent) => {
        const point = { lat: event.lngLat.lat, lng: event.lngLat.lng };
        setPlacement((current) => {
          if (current === 'camera') {
            camera.setLngLat(event.lngLat);
            setCameraPoint(point);
            return 'subject';
          }
          subject.setLngLat(event.lngLat);
          setSubjectPoint(point);
          return 'camera';
        });
      });
      map.on('error', (event) => {
        setMapError(event.error?.message || '地图加载失败，请检查网络后重试。');
      });
      map.on('load', () => {
        if (cancelled) return;
        map.addSource('planner-terrain', {
          type: 'raster-dem',
          url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
          tileSize: 256,
        });
        map.addSource('planner-fov', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        map.addLayer({
          id: 'planner-fov',
          type: 'fill',
          source: 'planner-fov',
          paint: {
            'fill-color': '#d8c19b',
            'fill-opacity': 0.16,
            'fill-outline-color': '#d8c19b',
          },
        });
        map.addSource('planner-rays', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        map.addLayer({
          id: 'planner-rays',
          type: 'line',
          source: 'planner-rays',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': ['get', 'width'],
            'line-dasharray': [2, 2],
          },
        });
        setMapError('');
        setMapReady(true);
        map.resize();
      });
      mapRef.current = map;
      cameraMarker.current = camera;
      subjectMarker.current = subject;
    }).catch(() => setMapError('地图加载失败，请刷新页面后重试。'));
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const scale = Math.min(Math.max(distance * 0.8, 120), 900);
    const sunEnd = destinationPoint(cameraPoint, sunPosition.azimuth, scale);
    const moonEnd = destinationPoint(
      cameraPoint,
      moonPosition.azimuth,
      scale * 0.78,
    );
    const source = mapRef.current.getSource(
      'planner-rays',
    ) as import('maplibre-gl').GeoJSONSource;
    void source?.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { color: '#1b1b19', width: 3 },
          geometry: {
            type: 'LineString',
            coordinates: [
              [cameraPoint.lng, cameraPoint.lat],
              [subjectPoint.lng, subjectPoint.lat],
            ],
          },
        },
        {
          type: 'Feature',
          properties: { color: '#e49e31', width: 2 },
          geometry: {
            type: 'LineString',
            coordinates: [
              [cameraPoint.lng, cameraPoint.lat],
              [sunEnd.lng, sunEnd.lat],
            ],
          },
        },
        {
          type: 'Feature',
          properties: { color: '#7999bc', width: 2 },
          geometry: {
            type: 'LineString',
            coordinates: [
              [cameraPoint.lng, cameraPoint.lat],
              [moonEnd.lng, moonEnd.lat],
            ],
          },
        },
      ],
    });
    const wedgeDistance = Math.max(distance * 1.12, 40);
    const arc = Array.from({ length: 17 }, (_, index) =>
      destinationPoint(
        cameraPoint,
        cameraBearing - fov / 2 + (fov * index) / 16,
        wedgeDistance,
      ),
    );
    const fovSource = mapRef.current.getSource(
      'planner-fov',
    ) as import('maplibre-gl').GeoJSONSource;
    void fovSource?.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [cameraPoint.lng, cameraPoint.lat],
                ...arc.map((point) => [point.lng, point.lat]),
                [cameraPoint.lng, cameraPoint.lat],
              ],
            ],
          },
        },
      ],
    });
  }, [
    mapReady,
    cameraPoint,
    subjectPoint,
    sunPosition.azimuth,
    moonPosition.azimuth,
    distance,
    cameraBearing,
    fov,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const is3d = mapMode === '3d';
    map.setTerrain(
      is3d
        ? {
            source: 'planner-terrain',
            exaggeration: 1.25,
          }
        : null,
    );
    if (map.getLayer('building-3d')) {
      map.setLayoutProperty(
        'building-3d',
        'visibility',
        is3d ? 'visible' : 'none',
      );
    }
    map.easeTo({
      pitch: is3d ? 62 : 0,
      bearing: is3d ? cameraBearing : 0,
      duration: 850,
    });
  }, [mapMode, mapReady, cameraBearing]);

  const useCurrentLocation = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('定位失败：当前浏览器不支持定位，请手动输入坐标。');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCameraPoint(point);
        cameraMarker.current?.setLngLat([point.lng, point.lat]);
        mapRef.current?.flyTo({ center: [point.lng, point.lat], zoom: 15 });
      },
      () =>
        setGeoError('定位失败：请允许位置权限，或手动输入机位坐标。'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const locateCoordinates = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = query
      .trim()
      .split(/[，,\s]+/)
      .filter(Boolean)
      .map(Number);
    if (
      values.length !== 2 ||
      !Number.isFinite(values[0]) ||
      !Number.isFinite(values[1]) ||
      Math.abs(values[0]) > 90 ||
      Math.abs(values[1]) > 180
    ) {
      setSearchError('搜索失败：请输入“纬度, 经度”，例如 31.2304, 121.4737。');
      return;
    }
    const point = { lat: values[0], lng: values[1] };
    setSubjectPoint(point);
    subjectMarker.current?.setLngLat([point.lng, point.lat]);
    mapRef.current?.flyTo({ center: [point.lng, point.lat], zoom: 16 });
    setSearchError('');
    setPlacement('camera');
  };

  const updateCoordinate = (
    kind: PlacementMode,
    axis: 'lat' | 'lng',
    rawValue: string,
  ) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    if (kind === 'camera') {
      const point = { ...cameraPoint, [axis]: value };
      setCameraPoint(point);
      cameraMarker.current?.setLngLat([point.lng, point.lat]);
    } else {
      const point = { ...subjectPoint, [axis]: value };
      setSubjectPoint(point);
      subjectMarker.current?.setLngLat([point.lng, point.lat]);
    }
  };

  const exportCard = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = '#171815';
    context.fillRect(0, 0, 1080, 1350);
    context.fillStyle = '#d8c19b';
    context.fillRect(72, 72, 88, 5);
    context.fillStyle = '#f2eee6';
    context.font = '600 64px Arial, sans-serif';
    context.fillText('机位与光线计划', 72, 158);
    context.fillStyle = '#8f9089';
    context.font = '30px Arial, sans-serif';
    context.fillText(placeName, 72, 214);
    context.fillText(
      `${date}  ${formatSliderTime(minutes)}  UTC${timezone >= 0 ? '+' : ''}${timezone}`,
      72,
      260,
    );

    const rows = [
      [
        '光线',
        `${light.label} / ${facadeLight.label} · 太阳 ${formatBearing(sunPosition.azimuth)} / ${sunPosition.altitude.toFixed(1)}°`,
      ],
      [
        '月亮',
        `${formatBearing(moonPosition.azimuth)} / 高度 ${moonPosition.altitude.toFixed(1)}° / 亮度 ${(moonLight.fraction * 100).toFixed(0)}%`,
      ],
      [
        '构图',
        `${sensorWidths[sensor].label} · ${focalLength}mm · 水平视角 ${fov.toFixed(1)}°`,
      ],
      [
        '距离',
        `${Math.round(distance)}m · 横向覆盖约 ${Math.round(coverage)}m · 目标宽 ${subjectWidth}m`,
      ],
      [
        '判断',
        isWideEnough
          ? `镜头够广，最长可用约 ${Math.floor(requiredFocal)}mm`
          : `镜头不够广，建议 ${Math.floor(requiredFocal)}mm 或更广`,
      ],
      [
        '日出/黄金/日落',
        `${formatTime(sunTimes.sunrise, timezone)} · ${formatTime(sunTimes.goldenHourEnd, timezone)} / ${formatTime(sunTimes.goldenHour, timezone)} · ${formatTime(sunTimes.sunset, timezone)}`,
      ],
      [
        '蓝调/月升',
        `${formatTime(sunTimes.dawn, timezone)}–${formatTime(sunTimes.sunrise, timezone)} / ${formatTime(sunTimes.sunset, timezone)}–${formatTime(sunTimes.dusk, timezone)} · ${formatTime(moonTimes.rise, timezone)}`,
      ],
    ];
    let y = 330;
    rows.forEach(([label, value]) => {
      context.fillStyle = '#73756f';
      context.font = '24px Arial, sans-serif';
      context.fillText(label, 72, y);
      context.fillStyle = '#f2eee6';
      context.font = '26px Arial, sans-serif';
      context.fillText(value, 190, y);
      context.strokeStyle = 'rgba(255,255,255,.1)';
      context.beginPath();
      context.moveTo(72, y + 34);
      context.lineTo(1008, y + 34);
      context.stroke();
      y += 92;
    });

    const cx = 540;
    const cy = 1050;
    context.strokeStyle = 'rgba(255,255,255,.14)';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(cx, cy, 160, 0, Math.PI * 2);
    context.stroke();
    const drawRay = (
      bearing: number,
      color: string,
      label: string,
      radius: number,
    ) => {
      const angle = ((bearing - 90) * Math.PI) / 180;
      const x = cx + Math.cos(angle) * radius;
      const rayY = cy + Math.sin(angle) * radius;
      context.strokeStyle = color;
      context.beginPath();
      context.moveTo(cx, cy);
      context.lineTo(x, rayY);
      context.stroke();
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, rayY, 13, 0, Math.PI * 2);
      context.fill();
      context.font = '24px Arial, sans-serif';
      context.fillText(label, x + 20, rayY + 8);
    };
    drawRay(cameraBearing, '#f2eee6', '被摄物', 122);
    drawRay(sunPosition.azimuth, '#f0b95b', '太阳', 160);
    drawRay(moonPosition.azimuth, '#9bb9d7', '月亮', 146);
    context.fillStyle = '#6f716c';
    context.font = '22px Arial, sans-serif';
    context.fillText(
      `机位 ${cameraPoint.lat.toFixed(5)}, ${cameraPoint.lng.toFixed(5)}`,
      72,
      1280,
    );
    context.textAlign = 'right';
    context.fillText('XLJFZ Photography', 1008, 1280);
    const link = document.createElement('a');
    link.download = `shoot-plan-${date}-${formatSliderTime(minutes).replace(':', '')}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const events = [
    ['蓝调开始', sunTimes.dawn],
    ['日出', sunTimes.sunrise],
    ['黄金结束', sunTimes.goldenHourEnd],
    ['黄金开始', sunTimes.goldenHour],
    ['日落', sunTimes.sunset],
    ['蓝调结束', sunTimes.dusk],
  ] as const;

  return (
    <div className="overflow-hidden border border-white/10 bg-[#181916] shadow-[0_30px_90px_rgba(0,0,0,.25)]">
      <div className="grid xl:grid-cols-[minmax(0,1.55fr)_minmax(390px,.85fr)]">
        <section className="relative min-h-[480px] border-b border-white/10 xl:min-h-[760px] xl:border-b-0 xl:border-r">
          <div
            ref={mapNode}
            className="planner-map"
            aria-label="摄影机位规划地图"
          />
          <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-5rem)] flex-wrap gap-2 rounded-sm bg-[#171815]/92 p-2 shadow-xl backdrop-blur md:left-5 md:top-5">
            <button
              type="button"
              onClick={() => setPlacement('camera')}
              className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${placement === 'camera' ? 'bg-[#e6dcc8] text-[#171815]' : 'text-white/65 hover:bg-white/[.08]'}`}
            >
              <Camera size={15} /> 放置机位
            </button>
            <button
              type="button"
              onClick={() => setPlacement('subject')}
              className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${placement === 'subject' ? 'bg-[#e6dcc8] text-[#171815]' : 'text-white/65 hover:bg-white/[.08]'}`}
            >
              <Building2 size={15} /> 放置被摄物
            </button>
            <button
              type="button"
              onClick={useCurrentLocation}
              className="flex items-center gap-2 px-3 py-2 text-xs text-white/65 transition-colors hover:bg-white/[.08] hover:text-white"
            >
              <LocateFixed size={15} /> 我的位置
            </button>
            <span className="hidden w-px bg-white/10 sm:block" />
            <button
              type="button"
              aria-pressed={mapMode === '2d'}
              disabled={!mapReady}
              onClick={() => setMapMode('2d')}
              className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors disabled:opacity-40 ${mapMode === '2d' ? 'bg-white/12 text-white' : 'text-white/65 hover:bg-white/[.08]'}`}
            >
              <Layers2 size={15} /> 二维地图
            </button>
            <button
              type="button"
              aria-pressed={mapMode === '3d'}
              disabled={!mapReady}
              onClick={() => setMapMode('3d')}
              className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors disabled:opacity-40 ${mapMode === '3d' ? 'bg-[#e6dcc8] text-[#171815]' : 'text-white/65 hover:bg-white/[.08]'}`}
            >
              <Mountain size={15} /> 三维地形
            </button>
          </div>
          <div className="absolute bottom-6 left-4 z-10 max-w-[calc(100%-2rem)] bg-[#171815]/92 px-4 py-3 text-xs leading-5 text-white/62 shadow-xl backdrop-blur md:left-6">
            {mapError || geoError || (
              <>
                {mapMode === '3d'
                  ? '三维模式 · 拖动指南针旋转，双指或右键调整视角'
                  : `点击地图放置${placement === 'camera' ? '机位' : '被摄物'} · 标记可拖动`}
              </>
            )}
          </div>
        </section>

        <section className="p-4 md:p-6 xl:max-h-[760px] xl:overflow-y-auto">
          <form onSubmit={locateCoordinates} className="mb-5">
            <label className="text-xs text-white/42" htmlFor="place-search">
              搜索地点（经纬度）
            </label>
            <div className="mt-2 flex">
              <input
                id="place-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="纬度, 经度，如 31.2304, 121.4737"
                className="min-w-0 flex-1 border border-white/12 bg-white/[.035] px-3 py-2.5 text-sm text-white outline-none focus:border-[#d8c19b]/60"
              />
              <button
                type="submit"
                className="flex items-center gap-2 bg-[#e6dcc8] px-4 text-xs text-[#171815] hover:bg-white"
              >
                <Search size={15} /> 定位
              </button>
            </div>
            {searchError && (
              <p className="mt-2 text-xs leading-5 text-orange-200/80">
                {searchError}
              </p>
            )}
            <p className="mt-2 text-[11px] leading-5 text-white/28">
              坐标仅在本页计算，不会发送给地点搜索服务。
            </p>
          </form>

          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 text-xs text-white/42">
              地点备注
              <input
                value={placeName}
                onChange={(event) => setPlaceName(event.target.value)}
                className="mt-2 w-full border border-white/12 bg-white/[.035] px-3 py-2.5 text-sm text-white outline-none focus:border-[#d8c19b]/60"
              />
            </label>
            <label className="text-xs text-white/42">
              机位纬度
              <input
                type="number"
                step="0.00001"
                value={cameraPoint.lat}
                onChange={(event) =>
                  updateCoordinate('camera', 'lat', event.target.value)
                }
                className="mt-2 w-full border border-white/12 bg-white/[.035] px-3 py-2.5 text-sm tabular-nums text-white outline-none"
              />
            </label>
            <label className="text-xs text-white/42">
              机位经度
              <input
                type="number"
                step="0.00001"
                value={cameraPoint.lng}
                onChange={(event) =>
                  updateCoordinate('camera', 'lng', event.target.value)
                }
                className="mt-2 w-full border border-white/12 bg-white/[.035] px-3 py-2.5 text-sm tabular-nums text-white outline-none"
              />
            </label>
            <label className="text-xs text-white/42">
              被摄物纬度
              <input
                type="number"
                step="0.00001"
                value={subjectPoint.lat}
                onChange={(event) =>
                  updateCoordinate('subject', 'lat', event.target.value)
                }
                className="mt-2 w-full border border-white/12 bg-white/[.035] px-3 py-2.5 text-sm tabular-nums text-white outline-none"
              />
            </label>
            <label className="text-xs text-white/42">
              被摄物经度
              <input
                type="number"
                step="0.00001"
                value={subjectPoint.lng}
                onChange={(event) =>
                  updateCoordinate('subject', 'lng', event.target.value)
                }
                className="mt-2 w-full border border-white/12 bg-white/[.035] px-3 py-2.5 text-sm tabular-nums text-white outline-none"
              />
            </label>
            <label className="text-xs text-white/42">
              日期
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-2 w-full border border-white/12 bg-white/[.035] px-3 py-2.5 text-sm text-white [color-scheme:dark] outline-none focus:border-[#d8c19b]/60"
              />
            </label>
            <label className="text-xs text-white/42">
              时区
              <select
                value={timezone}
                onChange={(event) => setTimezone(Number(event.target.value))}
                className="mt-2 w-full border border-white/12 bg-[#1d1e1b] px-3 py-2.5 text-sm text-white outline-none focus:border-[#d8c19b]/60"
              >
                {Array.from({ length: 27 }, (_, index) => index - 12).map(
                  (offset) => (
                    <option value={offset} key={offset}>
                      UTC{offset >= 0 ? '+' : ''}
                      {offset}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="col-span-2 text-xs text-white/42">
              立面朝向 · {formatBearing(facadeBearing)}
              <input
                type="range"
                min="0"
                max="359"
                step="1"
                value={facadeBearing}
                onChange={(event) => setFacadeBearing(Number(event.target.value))}
                className="planner-range mt-3 w-full"
              />
              <span className="mt-2 flex items-center justify-between text-[11px] text-white/28">
                <span>立面朝外法线方向</span>
                <button
                  type="button"
                  onClick={() => setFacadeBearing(cameraSideBearing)}
                  className="text-[#d8c19b] hover:text-white"
                >
                  取朝向机位的一面
                </button>
              </span>
            </label>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs tracking-[.16em] text-white/35">
                  当地时间
                </p>
                <p className="mt-2 text-3xl font-medium tabular-nums tracking-[-.04em]">
                  {formatSliderTime(minutes)}
                </p>
              </div>
              <span
                className={`border px-3 py-1.5 text-xs ${light.label === '顺光' ? 'border-amber-300/30 text-amber-200' : light.label === '侧光' ? 'border-orange-300/30 text-orange-200' : 'border-sky-300/30 text-sky-200'}`}
              >
                {light.label}
              </span>
            </div>
            <input
              aria-label="一天中的时间"
              type="range"
              min="0"
              max="1435"
              step="5"
              value={minutes}
              onChange={(event) => setMinutes(Number(event.target.value))}
              className="planner-range mt-5 w-full"
            />
            <div className="relative mt-2 h-3 border-t border-white/10">
              {events.map(([label, value]) => {
                const eventMinute = minutesAtZone(value, timezone);
                if (eventMinute === null) return null;
                return (
                  <span
                    key={label}
                    className="timeline-event"
                    style={{ left: `${(eventMinute / 1440) * 100}%` }}
                    title={`${label} ${formatTime(value, timezone)}`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[11px] tabular-nums text-white/28">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
            <p className="mt-4 text-sm text-white/58">{light.detail}</p>
            <p className="mt-2 text-xs text-white/42">
              {facadeLight.label}：{facadeLight.detail}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10">
            <div className="bg-[#1a1b18] p-3">
              <Sun size={16} className="text-[#f0b95b]" />
              <p className="mt-2 text-xs text-white/35">太阳</p>
              <p className="mt-1 text-sm tabular-nums">
                {formatBearing(sunPosition.azimuth)}
              </p>
              <p className="mt-1 text-xs text-white/42">
                高度 {sunPosition.altitude.toFixed(1)}°
              </p>
            </div>
            <div className="bg-[#1a1b18] p-3">
              <Moon size={16} className="text-[#9bb9d7]" />
              <p className="mt-2 text-xs text-white/35">月亮</p>
              <p className="mt-1 text-sm tabular-nums">
                {formatBearing(moonPosition.azimuth)}
              </p>
              <p className="mt-1 text-xs text-white/42">
                高度 {moonPosition.altitude.toFixed(1)}°
              </p>
            </div>
            <div className="bg-[#1a1b18] p-3">
              <Compass size={16} className="text-[#d8c19b]" />
              <p className="mt-2 text-xs text-white/35">拍摄方向</p>
              <p className="mt-1 text-sm tabular-nums">
                {formatBearing(cameraBearing)}
              </p>
              <p className="mt-1 text-xs text-white/42">
                距离 {Math.round(distance)}m
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid border-t border-white/10 lg:grid-cols-[1fr_1fr_1.05fr]">
        <section className="border-b border-white/10 p-5 md:p-6 lg:border-b-0 lg:border-r">
          <p className="text-xs tracking-[.16em] text-white/35">光线时段</p>
          <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
            {events.map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline justify-between border-b border-white/[.07] pb-2"
              >
                <span className="text-xs text-white/42">{label}</span>
                <span className="text-sm tabular-nums">
                  {formatTime(value, timezone)}
                </span>
              </div>
            ))}
            <div className="flex items-baseline justify-between border-b border-white/[.07] pb-2">
              <span className="text-xs text-white/42">月升</span>
              <span className="text-sm tabular-nums">
                {formatTime(moonTimes.rise, timezone)}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-b border-white/[.07] pb-2">
              <span className="text-xs text-white/42">月落</span>
              <span className="text-sm tabular-nums">
                {formatTime(moonTimes.set, timezone)}
              </span>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-5 text-white/28">
            蓝调采用民用曙暮光边界；山体、天气与地形遮挡会改变实际可见时间。
          </p>
        </section>

        <section className="border-b border-white/10 p-5 md:p-6 lg:border-b-0 lg:border-r">
          <p className="text-xs tracking-[.16em] text-white/35">焦段与覆盖</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="text-xs text-white/42">
              画幅
              <select
                value={sensor}
                onChange={(event) => setSensor(event.target.value as SensorKey)}
                className="mt-2 w-full border border-white/12 bg-[#1d1e1b] px-3 py-2.5 text-sm text-white outline-none"
              >
                {Object.entries(sensorWidths).map(([key, value]) => (
                  <option value={key} key={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-white/42">
              焦距 · mm
              <input
                type="number"
                min="4"
                max="1200"
                value={focalLength}
                onChange={(event) =>
                  setFocalLength(Math.max(4, Number(event.target.value)))
                }
                className="mt-2 w-full border border-white/12 bg-white/[.035] px-3 py-2.5 text-sm text-white outline-none"
              />
            </label>
            <label className="col-span-2 text-xs text-white/42">
              被摄物宽度 · m
              <input
                type="number"
                min="1"
                max="5000"
                value={subjectWidth}
                onChange={(event) =>
                  setSubjectWidth(Math.max(1, Number(event.target.value)))
                }
                className="mt-2 w-full border border-white/12 bg-white/[.035] px-3 py-2.5 text-sm text-white outline-none"
              />
            </label>
          </div>
          <div
            className={`mt-4 border px-4 py-3 ${isWideEnough ? 'border-emerald-300/20 bg-emerald-300/[.04]' : 'border-orange-300/25 bg-orange-300/[.05]'}`}
          >
            <p className="text-sm">
              {isWideEnough ? '这支镜头够广' : '这支镜头不够广'}
            </p>
            <p className="mt-1 text-xs leading-5 text-white/45">
              水平视角 {fov.toFixed(1)}°，当前距离覆盖约 {Math.round(coverage)}
              m。
              {isWideEnough
                ? `最长可用约 ${Math.floor(requiredFocal)}mm。`
                : `建议 ${Math.floor(requiredFocal)}mm 或更广，或后退机位。`}
            </p>
          </div>
        </section>

        <section className="p-5 md:p-6">
          <p className="text-xs tracking-[.16em] text-white/35">方向预览</p>
          <div className="mt-1 grid items-center sm:grid-cols-[180px_1fr] lg:grid-cols-1 xl:grid-cols-[180px_1fr]">
            <CompassPlot
              sunAzimuth={sunPosition.azimuth}
              moonAzimuth={moonPosition.azimuth}
              cameraBearing={cameraBearing}
              fov={Math.min(fov, 120)}
              sunAltitude={sunPosition.altitude}
              moonAltitude={moonPosition.altitude}
            />
            <div>
              <p className="text-sm leading-6 text-white/58">
                月面亮度约 {(moonLight.fraction * 100).toFixed(0)}
                %。当前立面朝向 {formatBearing(facadeBearing)}，判断为
                {facadeLight.label}。
              </p>
              <Button
                type="button"
                onClick={exportCard}
                className="mt-4 w-full rounded-none bg-[#e6dcc8] text-[#171815] hover:bg-white"
              >
                <Download size={16} />
                导出拍摄计划卡
              </Button>
              <p className="mt-3 text-[11px] leading-5 text-white/28">
                计算：SunCalc · 地图：MapLibre / OpenStreetMap
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
