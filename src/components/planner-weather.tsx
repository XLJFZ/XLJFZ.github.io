'use client';

import { useEffect, useRef, useState } from 'react';
import type { WeatherScore } from '@/lib/afterglow-engine.mjs';
import { Button } from '@/components/ui/button';

type Props = {
  lat: number;
  lon: number;
  date: string;
  timezone: number;
  bearing: number | null;
  sunset: Date | null;
  sunsetAzimuth: number;
};
const initialWeights = { gfs: 40, icon: 35, met: 25 };
const labels = {
  gfs: 'Open-Meteo · GFS',
  icon: 'Open-Meteo · ICON',
  met: 'MET Norway',
};

export function PlannerWeather(props: Props) {
  const { lat, lon, date, timezone, bearing, sunset, sunsetAzimuth } = props;
  const [weights, setWeights] = useState(initialWeights);
  const [result, setResult] = useState<WeatherScore | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [layer, setLayer] = useState('clouds');
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const sunsetStamp = sunset?.getTime() ?? Number.NaN;
  useEffect(
    () => () => {
      generation.current++;
      request.current?.abort();
    },
    [],
  );
  function changeWeight(key: keyof typeof weights, value: number) {
    generation.current++;
    request.current?.abort();
    setResult(null);
    setError('');
    setBusy(false);
    setWeights((current) => ({
      ...current,
      [key]: Math.max(0, Math.min(100, value)),
    }));
  }

  const query = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    date,
    offset: String(timezone),
    bearing: bearing === null ? 'unknown' : String(bearing),
  });
  const detailURL = 'https://xljfz.github.io/afterglow/?' + query;
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  async function predict() {
    if (!sunset || !Number.isFinite(sunsetStamp)) {
      setError('该地点在所选日期没有有效日落事件。');
      return;
    }
    if (total <= 0) {
      setError('请至少启用一个来源。');
      return;
    }
    const token = ++generation.current;
    const controller = new AbortController();
    request.current?.abort();
    request.current = controller;
    setBusy(true);
    setResult(null);
    setError('');
    const timer = setTimeout(() => controller.abort(), 90000);
    try {
      const { default: engine } = await import('@/lib/afterglow-engine.mjs');
      const next = await engine.forecast(
        {
          lat,
          lon,
          date,
          offset: timezone,
          bearing,
          provider: 'blend',
          weights,
          astronomy: { sunset: sunset.toISOString(), azimuth: sunsetAzimuth },
        },
        controller.signal,
      );
      if (token !== generation.current) return;
      if (next.unavailable) throw new Error(next.unavailable);
      setResult(next);
    } catch (cause) {
      if (token === generation.current)
        setError(
          cause instanceof Error && cause.name === 'AbortError'
            ? '查询已取消或超时，请重试。'
            : cause instanceof Error
              ? cause.message
              : '天气查询失败，请检查网络。',
        );
    } finally {
      clearTimeout(timer);
      if (token === generation.current) setBusy(false);
    }
  }
  const mapURL =
    'https://embed.windy.com/embed.html?' +
    new URLSearchParams({
      type: 'map',
      location: 'coordinates',
      lat: String(lat),
      lon: String(lon),
      zoom: '8',
      overlay: layer,
      product: layer === 'satellite' ? 'satellite' : 'ecmwf',
      level: 'surface',
    });
  return (
    <section
      aria-labelledby="planner-weather-heading"
      className="border-t border-white/10 bg-[#151713] p-5 md:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm tracking-[.16em] text-white/45">
            余晖 · 天气判断
          </p>
          <h2
            id="planner-weather-heading"
            className="mt-2 text-2xl font-medium"
          >
            机位选好了，天空值得期待吗？
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/65">
            共用上方相机位置、日期、时区和拍摄方向。太阳几何使用规划器现有
            SunCalc；天气分数是实验性判断。
          </p>
        </div>
        <a
          href={detailURL}
          className="min-h-11 border-b border-white/25 py-2 text-sm text-[#d8c19b]"
          target="_blank"
          rel="noreferrer"
        >
          区域预测图与完整分析 ↗
        </a>
      </div>
      <p className="mt-4 text-sm text-white/65">
        {date} · UTC{timezone >= 0 ? '+' : ''}
        {timezone} · 机位 {lat.toFixed(4)}, {lon.toFixed(4)} ·{' '}
        {bearing === null ? '方向未确定' : `拍摄方向 ${bearing.toFixed(1)}°`}
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {(Object.keys(weights) as (keyof typeof weights)[]).map((key) => (
          <label key={key} className="text-sm text-white/65">
            {labels[key]} ·{' '}
            {total ? ((weights[key] / total) * 100).toFixed(1) : '0'}%
            <input
              type="number"
              min="0"
              max="100"
              value={weights[key]}
              onChange={(e) => changeWeight(key, Number(e.target.value))}
              className="mt-2 block min-h-11 w-full border border-white/15 bg-black/15 px-3 text-base text-white"
            />
          </label>
        ))}
      </div>
      <p className="mt-3 text-sm leading-6 text-white/55">
        初始权重40 / 35 /
        25，未经观测校准，设0停用。MET为混合预报产品；不同来源并非完全独立。
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={busy}
          onClick={predict}
          className="min-h-11 rounded-none bg-[#e6dcc8] text-[#171815] hover:bg-white"
        >
          {busy ? '正在综合各来源预报…' : '查询晚霞与观赏潜力'}
        </Button>
        {busy && (
          <Button
            type="button"
            variant="outline"
            onClick={() => request.current?.abort()}
            className="min-h-11 rounded-none"
          >
            取消查询
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowMap((v) => !v)}
          className="min-h-11 rounded-none"
        >
          {showMap ? '收起云图' : '查看云图 / 卫星'}
        </Button>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/55">
        点击查询后，机位及太阳方向采样坐标发送至 Open-Meteo、MET
        Norway；查看云图会向 Windy 发送中心坐标。不会上传照片或自动保存观测。
      </p>
      <output aria-live="polite" className="mt-4 block text-sm text-[#d8c19b]">
        {error ||
          (busy
            ? '分批读取真实预报，最多约90秒。'
            : !result
              ? '尚未查询；修改机位、日期、方向或权重后，需要重新查询。'
              : '')}
      </output>
      {result && (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-white/12 p-5">
              <p className="text-sm text-white/60">晚霞条件潜力</p>
              <strong className="mt-2 block text-4xl font-normal text-[#e6dcc8]">
                {result.score}
                <span className="text-base text-white/45"> / 100</span>
              </strong>
            </div>
            <div className="border border-white/12 p-5">
              <p className="text-sm text-white/60">火烧云观赏潜力</p>
              <strong className="mt-2 block text-4xl font-normal text-[#dfb295]">
                {result.beauty?.score ?? '—'}
                <span className="text-base text-white/45"> / 100</span>
              </strong>
            </div>
            <div className="border border-white/12 p-5">
              <p className="text-sm text-white/60">
                资料可靠性：{result.confidence}
              </p>
              <p className="mt-3 text-sm text-white/65">
                {result.spread === null
                  ? '仅一个有效来源'
                  : `来源得分极差 ${result.spread} 分`}
                <br />
                不是发生概率或统计置信区间
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-white/50">
                <tr>
                  <th className="p-3">来源</th>
                  <th className="p-3">条件潜力</th>
                  <th className="p-3">观赏潜力</th>
                  <th className="p-3">实际占比</th>
                  <th className="p-3">状态</th>
                </tr>
              </thead>
              <tbody>
                {result.members.map((member) => (
                  <tr key={member.id} className="border-t border-white/10">
                    <td className="p-3">{member.name}</td>
                    <td className="p-3">{member.score ?? '—'}</td>
                    <td className="p-3">{member.beauty ?? '—'}</td>
                    <td className="p-3">
                      {member.effectiveWeight.toFixed(1)}%
                    </td>
                    <td className="p-3">{member.error || '可用'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.beauty && (
            <div className="grid gap-3 md:grid-cols-2">
              {result.beauty.dimensions.map((d) => (
                <p
                  key={d.name}
                  className="border border-white/10 p-3 text-sm text-white/70"
                >
                  {d.name}：{d.value ?? '缺失'} / 100
                </p>
              ))}
            </div>
          )}
          <div className="space-y-2 text-sm leading-7 text-white/60">
            {result.beauty?.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
            {result.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
          <p className="text-sm text-white/45">
            获取：{new Date(result.fetched_at).toLocaleString('zh-CN')} ·{' '}
            {result.version} · 气象数据：Open-Meteo / MET Norway ·
            不代表天气模式起报时间
          </p>
        </div>
      )}
      {showMap && (
        <div className="mt-6">
          <label className="text-sm text-white/65">
            图层
            <select
              value={layer}
              onChange={(e) => setLayer(e.target.value)}
              className="ml-3 min-h-11 border border-white/15 bg-[#252820] px-3 text-base"
            >
              <option value="clouds">总云量</option>
              <option value="lclouds">低云</option>
              <option value="mclouds">中云</option>
              <option value="hclouds">高云</option>
              <option value="satellite">卫星云图</option>
            </select>
          </label>
          <iframe
            src={mapURL}
            title="当前机位 Windy 云图"
            className="mt-4 h-[400px] w-full border-0 md:h-[520px]"
            loading="lazy"
            allowFullScreen
          />
          <p className="mt-3 text-sm leading-6 text-white/55">
            Windy官方嵌入图；图内模型和时间轴独立于评分。云图不是实际晚霞颜色。窗口不可用时可在
            <a
              href={mapURL}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              独立窗口打开
            </a>
            。
          </p>
        </div>
      )}
    </section>
  );
}
