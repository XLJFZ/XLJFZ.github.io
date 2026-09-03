'use client';

import 'maplibre-gl/dist/maplibre-gl.css';

import {
  Building2,
  Camera,
  Compass,
  Download,
  LocateFixed,
  Moon,
  Sun,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as SunCalc from 'suncalc';

import { Button } from '@/components/ui/button';
import {
  bearingDegrees,
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
  const facadeBearing = useMemo(
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
    facadeBearing,
    sunPosition.altitude,
  );

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    let cancelled = false;
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
      map.on('load', () => {
        if (cancelled) return;
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
        setMapReady(true);
      });
      mapRef.current = map;
      cameraMarker.current = camera;
      subjectMarker.current = subject;
    });
    return () => {
      cancelled = true;
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
  }, [
    mapReady,
    cameraPoint,
    subjectPoint,
    sunPosition.azimuth,
    moonPosition.azimuth,
    distance,
  ]);

  const useCurrentLocation = () => {
    navigator.geolocation?.getCurrentPosition((position) => {
      const point = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setCameraPoint(point);
      cameraMarker.current?.setLngLat([point.lng, point.lat]);
      mapRef.current?.flyTo({ center: [point.lng, point.lat], zoom: 15 });
    });
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
        `${light.label} · 太阳 ${formatBearing(sunPosition.azimuth)} / 高度 ${sunPosition.altitude.toFixed(1)}°`,
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
    ];
    let y = 360;
    rows.forEach(([label, value]) => {
      context.fillStyle = '#73756f';
      context.font = '24px Arial, sans-serif';
      context.fillText(label, 72, y);
      context.fillStyle = '#f2eee6';
      context.font = '32px Arial, sans-serif';
      context.fillText(value, 190, y);
      context.strokeStyle = 'rgba(255,255,255,.1)';
      context.beginPath();
      context.moveTo(72, y + 34);
      context.lineTo(1008, y + 34);
      context.stroke();
      y += 126;
    });

    const cx = 540;
    const cy = 1030;
    context.strokeStyle = 'rgba(255,255,255,.14)';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(cx, cy, 180, 0, Math.PI * 2);
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
    drawRay(cameraBearing, '#f2eee6', '被摄物', 138);
    drawRay(sunPosition.azimuth, '#f0b95b', '太阳', 180);
    drawRay(moonPosition.azimuth, '#9bb9d7', '月亮', 165);
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
    link.click();
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
            className="absolute inset-0"
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
          </div>
          <div className="absolute bottom-6 left-4 z-10 max-w-[calc(100%-2rem)] bg-[#171815]/92 px-4 py-3 text-xs leading-5 text-white/62 shadow-xl backdrop-blur md:left-6">
            点击地图放置{placement === 'camera' ? '机位' : '被摄物'} ·
            标记可拖动
          </div>
        </section>

        <section className="p-4 md:p-6 xl:max-h-[760px] xl:overflow-y-auto">
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
            <div className="mt-2 flex justify-between text-[11px] tabular-nums text-white/28">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
            <p className="mt-4 text-sm text-white/58">{light.detail}</p>
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
                %。立面判断按被摄物朝向机位的一面计算。
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
                计算：SunCalc · 地图：MapLibre / OpenFreeMap / OpenStreetMap
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
