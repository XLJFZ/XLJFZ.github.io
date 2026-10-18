/* Shared, dependency-free browser/Node forecasting engine. No API secrets. */
const Afterglow = (() => {
  'use strict';
  const rad = Math.PI / 180,
    fields = [
      'cloud_cover_low',
      'cloud_cover_mid',
      'cloud_cover_high',
      'relative_humidity_2m',
      'visibility',
      'precipitation',
      'wind_speed_10m',
    ];
  const members = [
    {
      id: 'gfs',
      name: 'Open-Meteo · GFS',
      provider: 'openmeteo',
      model: 'gfs_seamless',
      weight: 40,
    },
    {
      id: 'icon',
      name: 'Open-Meteo · ICON',
      provider: 'openmeteo',
      model: 'icon_seamless',
      weight: 35,
    },
    {
      id: 'met',
      name: 'MET Norway · Locationforecast',
      provider: 'metno',
      model: 'MET Locationforecast',
      weight: 25,
    },
  ];
  const finite = (v) => typeof v === 'number' && Number.isFinite(v);
  const cache = new Map();
  async function json(url, signal) {
    if (signal?.aborted) throw new DOMException('请求已取消', 'AbortError');
    const old = cache.get(url);
    if (old && old.until > Date.now()) return old.data;
    const r = await fetch(url, { signal });
    if (!r.ok)
      throw Error(
        `天气服务 HTTP ${r.status}${r.status === 429 ? '：请求过于频繁，请稍后重试' : ''}`,
      );
    const data = await r.json();
    if (data.error) throw Error(data.reason || data.error);
    const expiry = Date.parse(r.headers.get('Expires') || '');
    cache.set(url, {
      data,
      until:
        finite(expiry) && expiry > Date.now() ? expiry : Date.now() + 600000,
    });
    return data;
  }
  function solar(t, lat, lon) {
    const n = Math.floor(
      (Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) -
        Date.UTC(t.getUTCFullYear(), 0, 0)) /
        86400000,
    );
    const hour =
      t.getUTCHours() + t.getUTCMinutes() / 60 + t.getUTCSeconds() / 3600;
    const g = ((2 * Math.PI) / 365) * (n - 1 + (hour - 12) / 24);
    const eq =
      229.18 *
      (0.000075 +
        0.001868 * Math.cos(g) -
        0.032077 * Math.sin(g) -
        0.014615 * Math.cos(2 * g) -
        0.040849 * Math.sin(2 * g));
    const dec =
      0.006918 -
      0.399912 * Math.cos(g) +
      0.070257 * Math.sin(g) -
      0.006758 * Math.cos(2 * g) +
      0.000907 * Math.sin(2 * g) -
      0.002697 * Math.cos(3 * g) +
      0.00148 * Math.sin(3 * g);
    const minutes = (((hour * 60 + eq + 4 * lon) % 1440) + 1440) % 1440;
    const ha = (minutes / 4 - 180) * rad,
      p = lat * rad;
    return [
      Math.asin(
        Math.sin(p) * Math.sin(dec) +
          Math.cos(p) * Math.cos(dec) * Math.cos(ha),
      ) / rad,
      (Math.atan2(
        Math.sin(ha),
        Math.cos(ha) * Math.sin(p) - Math.tan(dec) * Math.cos(p),
      ) /
        rad +
        180) %
        360,
    ];
  }
  function localISO(t, offset) {
    const shifted = new Date(t.getTime() + offset * 3600000)
      .toISOString()
      .slice(0, 23);
    const sign = offset >= 0 ? '+' : '-',
      m = Math.round(Math.abs(offset) * 60);
    return (
      shifted +
      sign +
      String(Math.floor(m / 60)).padStart(2, '0') +
      ':' +
      String(m % 60).padStart(2, '0')
    );
  }
  function astronomy(day, lat, lon, offset, event = 'sunset') {
    const start = new Date(day + 'T00:00:00Z').getTime() - offset * 3600000;
    const events = {};
    let prev = solar(new Date(start), lat, lon)[0];
    for (let i = 1; i <= 1440; i++) {
      const t = new Date(start + i * 60000),
        alt = solar(t, lat, lon)[0];
      for (const [name, h] of event === 'sunrise'
        ? [
            ['sunrise', -0.833],
            ['blue_start', -6],
            ['blue_end', -4],
            ['golden_end', 6],
          ]
        : [
            ['golden_start', 6],
            ['sunset', -0.833],
            ['blue_start', -4],
            ['blue_end', -6],
          ])
        if (event === 'sunrise' ? prev < h && alt >= h : prev > h && alt <= h) {
          const event = new Date(
            t.getTime() - (1 - (prev - h) / (prev - alt)) * 60000,
          );
          events[name] = localISO(event, offset);
          if (name === 'sunset' || name === 'sunrise')
            events.azimuth = Math.round(solar(event, lat, lon)[1] * 10) / 10;
        }
      prev = alt;
    }
    return events;
  }
  function destination(lat, lon, bearing, km) {
    const p = lat * rad,
      l = lon * rad,
      b = bearing * rad,
      d = km / 6371;
    const p2 = Math.asin(
      Math.sin(p) * Math.cos(d) + Math.cos(p) * Math.sin(d) * Math.cos(b),
    );
    const l2 =
      l +
      Math.atan2(
        Math.sin(b) * Math.sin(d) * Math.cos(p),
        Math.cos(d) - Math.sin(p) * Math.sin(p2),
      );
    return [
      Number((p2 / rad).toFixed(4)),
      Number((((l2 / rad + 540) % 360) - 180).toFixed(4)),
    ];
  }
  function nearest(rows, time) {
    if (!rows?.length) throw Error('没有可用预报时次');
    const row = rows.reduce((a, b) =>
      Math.abs(Date.parse(a.time) - time) < Math.abs(Date.parse(b.time) - time)
        ? a
        : b,
    );
    if (Math.abs(Date.parse(row.time) - time) > 5400000)
      throw Error('所选日期超出该模型的预报范围');
    return row;
  }
  function score(row, samples, trend) {
    const [low, mid, high] = fields.slice(0, 3).map((f) => row[f]);
    if (![low, mid, high].every(finite)) throw Error('缺少分层云量，无法评分');
    const dimensions = [
      {
        name: '中高云受光潜力',
        value: Math.max(0, 100 - Math.abs(high * 0.6 + mid * 0.4 - 50) * 2),
        weight: 35,
      },
      {
        name: '日落方向通透度',
        value: 100 - Math.max(...samples.map((s) => s.cloud_cover_low)),
        weight: 25,
      },
      {
        name: '云层结构代理指标',
        value: Math.max(0, 100 - Math.abs(high - mid) * 0.6),
        weight: 20,
      },
      {
        name: '大气透明度',
        value: finite(row.visibility)
          ? Math.min(100, row.visibility / 200)
          : null,
        weight: 10,
      },
      {
        name: '窗口内云量稳定性',
        value: finite(trend) ? Math.max(0, 100 - Math.abs(trend) * 2) : null,
        weight: 10,
      },
    ];
    const available = dimensions.filter((x) => finite(x.value));
    let value =
      available.reduce((n, x) => n + x.value * x.weight, 0) /
      available.reduce((n, x) => n + x.weight, 0);
    if (finite(row.precipitation))
      value *= Math.max(0.25, 1 - Math.min(row.precipitation, 3) * 0.2);
    return {
      score: Math.round(value),
      dimensions: dimensions.map((x) => ({
        ...x,
        value: finite(x.value) ? Math.round(x.value) : null,
      })),
    };
  }
  function corridorClarity(samples) {
    const near = samples.filter(
      (s) =>
        finite(s.cloud_cover_low) &&
        (!finite(s._distance) || s._distance <= 80),
    );
    if (!near.length) return null;
    const rays = new Map();
    for (const s of near) {
      const key = finite(s._bearing) ? Math.round(s._bearing) : 0;
      rays.set(key, Math.max(rays.get(key) || 0, s.cloud_cover_low));
    }
    return 100 - [...rays.values()].reduce((n, v) => n + v, 0) / rays.size;
  }
  // Experimental visual-potential proxies, not a color simulation or probability.
  function beauty(row, samples, trend) {
    const high = row.cloud_cover_high,
      mid = row.cloud_cover_mid;
    if (![high, mid, row.cloud_cover_low].every(finite))
      throw Error('缺少分层云量，无法评估观赏潜力');
    const cover = Math.max(high, mid); // Avoid pretending marginal layer covers reveal cloud overlap.
    const canvas =
      cover <= 55
        ? (cover / 55) * 100
        : Math.max(0, 100 - ((cover - 55) / 45) * 60);
    const layering = Math.max(high, mid) * 0.5 + Math.sqrt(high * mid) * 0.5; // Coexistence proxy only; not measured texture.
    const horizon = corridorClarity(samples);
    const stability = finite(trend)
      ? Math.max(0, 100 - Math.abs(trend) * 2)
      : null;
    const dimensions = [
      { name: '中高云画布（覆盖代理）', value: canvas, weight: 40 },
      { name: '分层共存（层次代理）', value: layering, weight: 20 },
      { name: '低云开口（通透代理）', value: horizon, weight: 25 },
      { name: '云量稳定性', value: stability, weight: 15 },
    ];
    const available = dimensions.filter((d) => finite(d.value));
    let value =
      available.reduce((n, d) => n + d.value * d.weight, 0) /
      available.reduce((n, d) => n + d.weight, 0);
    // A clear sky cannot get high fiery-cloud visual potential from transparent air alone.
    value *= Math.min(1, cover / 20);
    if (finite(horizon)) value *= 0.3 + (0.7 * horizon) / 100;
    if (finite(row.precipitation))
      value *= Math.max(0.25, 1 - Math.min(row.precipitation, 3) * 0.2);
    const notes = [];
    if (cover < 20)
      notes.push('中高云偏少，可能仅有地平线渐变，大片火烧云的画布不足。');
    else if (cover > 85)
      notes.push(
        '中高云覆盖较满；若云层较厚，可能缺乏明暗对比，但当前没有云光学厚度数据。',
      );
    else
      notes.push(
        '中高云覆盖适中，有形成彩云画面的空间；颜色和纹理仍需现场或影像确认。',
      );
    if (finite(horizon) && horizon < 40)
      notes.push('日落方向低云偏多，可能削弱受光和可见范围。');
    if (high > 20 && mid > 20)
      notes.push(
        '中、高云均有一定覆盖，存在多层画面的可能，但不代表已识别出鱼鳞云或卷云纹理。',
      );
    return {
      score: Math.round(value),
      dimensions: dimensions.map((d) => ({
        ...d,
        value: finite(d.value) ? Math.round(d.value) : null,
      })),
      notes,
    };
  }
  function weighted(items) {
    const valid = items.filter(
      (x) => finite(x.value) && finite(x.weight) && x.weight > 0,
    );
    return valid.length
      ? valid.reduce((s, x) => s + x.value * x.weight, 0) /
          valid.reduce((s, x) => s + x.weight, 0)
      : null;
  }
  async function pool(items, fn, limit = 2) {
    const results = Array.from({ length: items.length });
    let cursor = 0;
    await Promise.all(
      Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (cursor < items.length) {
          const i = cursor++;
          try {
            results[i] = await fn(items[i], i);
          } catch (e) {
            results[i] = { error: e.message };
          }
        }
      }),
    );
    return results;
  }
  async function getRows(points, member, day, signal) {
    if (member.provider === 'openmeteo') {
      const q = new URLSearchParams({
        latitude: points.map((p) => p.lat).join(','),
        longitude: points.map((p) => p.lon).join(','),
        hourly: fields.join(','),
        start_date: day,
        end_date: day,
        timezone: 'UTC',
        models: member.model,
      });
      const data = await json(
        'https://api.open-meteo.com/v1/forecast?' + q,
        signal,
      );
      const list = Array.isArray(data) ? data : [data];
      return points.map((_, i) => {
        const h = list[i]?.hourly;
        if (!h) return { error: '该采样点无数据' };
        return {
          rows: h.time.map((t, j) =>
            Object.fromEntries([
              ['time', new Date(t + 'Z').toISOString()],
              ...fields.map((f) => [f, h[f]?.[j] ?? null]),
            ]),
          ),
        };
      });
    }
    return pool(
      points,
      async (p) => {
        const data = await json(
          'https://api.met.no/weatherapi/locationforecast/2.0/complete?' +
            new URLSearchParams({
              lat: p.lat.toFixed(4),
              lon: p.lon.toFixed(4),
            }),
          signal,
        );
        return {
          rows: data.properties.timeseries.map((x) => {
            const d = x.data.instant.details;
            return {
              time: new Date(x.time).toISOString(),
              cloud_cover_low: d.cloud_area_fraction_low ?? null,
              cloud_cover_mid: d.cloud_area_fraction_medium ?? null,
              cloud_cover_high: d.cloud_area_fraction_high ?? null,
              relative_humidity_2m: d.relative_humidity ?? null,
              visibility: null,
              precipitation:
                x.data.next_1_hours?.details?.precipitation_amount ?? null,
              wind_speed_10m: finite(d.wind_speed) ? d.wind_speed * 3.6 : null,
            };
          }),
        };
      },
      2,
    );
  }
  function evaluateMember(points, data, sunset) {
    const samples = points.map((p, i) => {
      try {
        if (data[i].error) throw Error(data[i].error);
        return { ...p, row: nearest(data[i].rows, sunset) };
      } catch (e) {
        return { ...p, error: e.message };
      }
    });
    if (!samples[0].row) throw Error(samples[0].error);
    const valid = samples
      .slice(1)
      .filter((s) => finite(s.row?.cloud_cover_low));
    if (!valid.length) throw Error('日落方向采样均不可用');
    const row = samples[0].row;
    const timeline = data[0].rows.filter(
      (x) => Math.abs(Date.parse(x.time) - sunset) < 10800000,
    );
    const clouds = timeline.map((x) => x.cloud_cover_mid).filter(finite);
    const result = score(
      row,
      valid.map((s) => ({
        ...s.row,
        _bearing: s.bearing,
        _distance: s.distance,
      })),
      clouds.length > 1 ? Math.max(...clouds) - Math.min(...clouds) : null,
    );
    return {
      ...result,
      beauty: beauty(
        row,
        valid.map((s) => ({
          ...s.row,
          _bearing: s.bearing,
          _distance: s.distance,
        })),
        clouds.length > 1 ? Math.max(...clouds) - Math.min(...clouds) : null,
      ),
      weather: row,
      samples,
      timeline,
      complete: fields.filter((f) => finite(row[f])).length / fields.length,
      spatialCoverage: valid.length / (points.length - 1),
    };
  }
  function aggregate(results, requested) {
    const active = results.filter((x) => !x.error && x.requestedWeight > 0);
    if (!active.length)
      throw Error(
        '没有可用来源：' +
          results.map((x) => x.name + ' ' + (x.error || '权重为零')).join('；'),
      );
    const total = active.reduce((n, x) => n + x.requestedWeight, 0);
    const combine = (get) =>
      weighted(
        active.map((x) => ({ value: get(x), weight: x.requestedWeight })),
      );
    const scoreValue = Math.round(combine((x) => x.score));
    const spread =
      active.length > 1
        ? Math.max(...active.map((x) => x.score)) -
          Math.min(...active.map((x) => x.score))
        : null;
    const complete = combine((x) => x.complete);
    const spatialCoverage = combine((x) => x.spatialCoverage);
    const coverage = total / requested;
    const memberTable = results.map((x) => ({
      id: x.id,
      name: x.name,
      score: x.error ? null : x.score,
      beauty: x.beauty?.score ?? null,
      requestedWeight: x.requestedWeight,
      effectiveWeight: x.error ? 0 : (x.requestedWeight / total) * 100,
      error: x.error || null,
    }));
    const dimensions = active[0].dimensions.map((d, i) => ({
      ...d,
      value: ((v) => (v === null ? null : Math.round(v)))(
        combine((x) => x.dimensions[i].value),
      ),
      coverage:
        active
          .filter((x) => finite(x.dimensions[i].value))
          .reduce((n, x) => n + x.requestedWeight, 0) / total,
    }));
    const mixRow = (get) =>
      Object.fromEntries(fields.map((f) => [f, combine((x) => get(x)?.[f])]));
    const weather = mixRow((x) => x.weather);
    const samples = active[0].samples.map((p, i) => {
      const row = mixRow((x) => x.samples[i]?.row);
      return {
        ...p,
        row,
        error: row.cloud_cover_low === null ? '该点所有来源均缺失' : undefined,
      };
    });
    const times = [
      ...new Set(active.flatMap((x) => x.timeline.map((r) => r.time))),
    ].sort((a, b) => Date.parse(a) - Date.parse(b));
    const timeline = times.map((t) => ({
      time: t,
      ...mixRow((x) => {
        try {
          const r = nearest(x.timeline, Date.parse(t));
          return Math.abs(Date.parse(r.time) - Date.parse(t)) <= 1800000
            ? r
            : null;
        } catch {
          return null;
        }
      }),
    }));
    const beautyScore = combine((x) => x.beauty?.score);
    const beautyTemplate = active.find((x) => x.beauty)?.beauty;
    const visual = beautyTemplate
      ? {
          score: Math.round(beautyScore),
          dimensions: beautyTemplate.dimensions.map((d, i) => ({
            ...d,
            value: ((v) => (v === null ? null : Math.round(v)))(
              combine((x) => x.beauty?.dimensions[i]?.value),
            ),
          })),
          notes: [...new Set(active.flatMap((x) => x.beauty?.notes || []))],
        }
      : null;
    return {
      score: scoreValue,
      beauty: visual,
      dimensions,
      weather,
      samples,
      timeline,
      spread,
      complete,
      spatialCoverage,
      coverage,
      members: memberTable,
    };
  }
  async function forecast(options, signal) {
    const { lat, lon, date, offset, provider, model, bearing } = options;
    if (
      ![lat, lon, offset].every(finite) ||
      Math.abs(lat) > 90 ||
      Math.abs(lon) > 180 ||
      offset < -12 ||
      offset > 14 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !finite(Date.parse(date))
    )
      throw Error('请检查坐标、日期和时区');
    const astro = options.astronomy ?? astronomy(date, lat, lon, offset);
    if (!astro.sunset)
      return {
        astronomy: astro,
        unavailable: '该地点在所选日期没有日落事件。',
      };
    const sunset = Date.parse(astro.sunset),
      utcDay = new Date(sunset).toISOString().slice(0, 10);
    const points = [
      {
        lat: Number(lat.toFixed(4)),
        lon: Number(lon.toFixed(4)),
        distance: 0,
        bearing: astro.azimuth,
      },
    ];
    for (const distance of [30, 80])
      for (const a of [-30, 0, 30]) {
        const [p, l] = destination(lat, lon, astro.azimuth + a, distance);
        points.push({ lat: p, lon: l, distance, bearing: astro.azimuth + a });
      }
    const requested =
      provider === 'blend'
        ? members.map((m) => ({
            ...m,
            requestedWeight: Number(options.weights?.[m.id] ?? m.weight),
          }))
        : [
            {
              id: 'single',
              name:
                provider === 'metno'
                  ? 'MET Norway · Locationforecast'
                  : 'Open-Meteo · ' + model,
              provider,
              model,
              requestedWeight: 100,
            },
          ];
    if (
      requested.some(
        (m) =>
          !finite(m.requestedWeight) ||
          m.requestedWeight < 0 ||
          m.requestedWeight > 100,
      ) ||
      !requested.some((m) => m.requestedWeight > 0)
    )
      throw Error('请至少为一个来源设置大于零的权重（范围0–100）。');
    const active = requested.filter((m) => m.requestedWeight > 0);
    const results = await pool(
      active,
      async (m) => {
        try {
          return {
            ...m,
            ...evaluateMember(
              points,
              await getRows(points, m, utcDay, signal),
              sunset,
            ),
          };
        } catch (e) {
          return { ...m, error: e.message };
        }
      },
      2,
    );
    if (signal?.aborted) throw new DOMException('请求已取消', 'AbortError');
    const combined = aggregate(
      results,
      active.reduce((n, m) => n + m.requestedWeight, 0),
    );
    const lead = Math.max(0, (sunset - Date.now()) / 86400000);
    const reliability =
      combined.coverage === 1 &&
      combined.complete >= 0.9 &&
      combined.spatialCoverage === 1 &&
      lead < 2 &&
      (combined.spread === null || combined.spread < 20)
        ? '中'
        : '低';
    const warnings = [
      '评分与色彩强度、发生概率均未经过历史观测校准；权重为可调整的工程设置。',
      '未接入地形、建筑遮挡和云光学厚度；云量不等于实际受光或遮挡。',
      '拍摄窗口采用日落前30分钟至后20分钟的经验范围。',
    ];
    if (combined.coverage < 1)
      warnings.push(
        '部分来源失败，已剔除并对成功来源重新归一权重；当前结果不代表完整多源综合。',
      );
    if (combined.complete < 1)
      warnings.push(
        '有来源缺失能见度或其他字段，分项按可用数据计算，不能视作所有模型均支持该指标。',
      );
    if (combined.spatialCoverage < 1)
      warnings.push('部分空间采样点缺失，结果可靠性降低。');
    if (combined.spread !== null && combined.spread >= 20)
      warnings.push(
        '来源间评分分歧较大，综合均值可能掩盖不同天气情景，请查看各来源得分。',
      );
    if (provider === 'blend')
      warnings.push(
        'MET Norway 为混合预报产品，全球区域可能使用 ECMWF；不同来源并非完全独立。',
      );
    return {
      ...combined,
      astronomy: astro,
      provider,
      model: provider === 'blend' ? '加权综合' : model,
      alignment: finite(bearing)
        ? Math.round(Math.abs(((bearing - astro.azimuth + 540) % 360) - 180))
        : null,
      confidence: reliability,
      confidence_note:
        '可靠性参考资料完整性、空间采样、预报时效和来源评分分歧；不是概率或统计置信区间。最高仅标为中，未经实测校准。',
      window: [
        localISO(new Date(sunset - 1800000), offset),
        localISO(new Date(sunset + 1200000), offset),
      ],
      timeline: combined.timeline.map((x) => ({
        ...x,
        local_time: localISO(new Date(x.time), offset).slice(11, 16),
      })),
      fetched_at: new Date().toISOString(),
      version: 'rules-0.4-regional',
      warnings,
    };
  }
  function makeGrid(bounds, cols = 9, rows = 7) {
    const [south, west, north, east] = bounds;
    if (
      ![south, west, north, east].every(finite) ||
      south >= north ||
      west >= east ||
      south < -85 ||
      north > 85 ||
      west < -180 ||
      east > 180
    )
      throw Error('地图范围无效或跨越日期变更线，请缩小范围');
    const dy = (north - south) / rows,
      dx = (east - west) / cols;
    return Array.from({ length: cols * rows }, (_, i) => {
      const y = Math.floor(i / cols),
        x = i % cols;
      return {
        lat: south + (y + 0.5) * dy,
        lon: west + (x + 0.5) * dx,
        bounds: [
          [south + y * dy, west + x * dx],
          [south + (y + 1) * dy, west + (x + 1) * dx],
        ],
      };
    });
  }
  async function regional(options, signal, onProgress = () => {}) {
    const {
      bounds,
      date,
      offset,
      event = 'sunset',
      model = 'gfs_seamless',
    } = options;
    const cells = makeGrid(bounds, options.cols || 9, options.rows || 7);
    if (cells.length > 63)
      throw Error('当前交互版最多63格，细网格需要后台批量计算。');
    const sets = cells.map((cell) => {
      const astro = astronomy(date, cell.lat, cell.lon, offset, event);
      const time = astro[event];
      if (!time) return { ...cell, astro, error: '无对应日出/日落事件' };
      const points = [
        {
          lat: Number(cell.lat.toFixed(4)),
          lon: Number(cell.lon.toFixed(4)),
          distance: 0,
          bearing: astro.azimuth,
        },
      ];
      for (const distance of [30, 80])
        for (const delta of [-30, 0, 30]) {
          const [lat, lon] = destination(
            cell.lat,
            cell.lon,
            astro.azimuth + delta,
            distance,
          );
          points.push({ lat, lon, distance, bearing: astro.azimuth + delta });
        }
      return {
        ...cell,
        astro,
        time,
        points,
        data: Array.from({ length: points.length }),
      };
    });
    const groups = new Map();
    for (const cell of sets)
      if (cell.points)
        for (let i = 0; i < cell.points.length; i++) {
          const day = new Date(cell.time).toISOString().slice(0, 10);
          if (!groups.has(day)) groups.set(day, []);
          groups.get(day).push({ cell, index: i, point: cell.points[i] });
        }
    const batches = [];
    for (const [day, points] of groups)
      for (let i = 0; i < points.length; i += 40)
        batches.push({ day, points: points.slice(i, i + 40) });
    let completed = 0;
    await pool(
      batches,
      async (batch) => {
        if (signal?.aborted) throw new DOMException('已取消', 'AbortError');
        let data;
        try {
          data = await getRows(
            batch.points.map((x) => x.point),
            { provider: 'openmeteo', model },
            batch.day,
            signal,
          );
        } catch (e) {
          data = batch.points.map(() => ({ error: e.message }));
        }
        batch.points.forEach((x, i) => {
          x.cell.data[x.index] = data[i];
        });
        completed++;
        onProgress(completed, batches.length);
      },
      2,
    );
    if (signal?.aborted) throw new DOMException('已取消', 'AbortError');
    const output = sets.map((cell) => {
      const { points, data, ...rest } = cell;
      if (cell.error) return rest;
      try {
        const d = evaluateMember(points, data, Date.parse(cell.time));
        return {
          ...rest,
          score: d.score,
          beauty: d.beauty.score,
          coverage: d.spatialCoverage,
          weather: d.weather,
        };
      } catch (e) {
        return { ...rest, error: e.message };
      }
    });
    if (!output.some((c) => !c.error))
      throw Error(
        '全部网格均无可用预报，请检查日期、网络或稍后重试。' +
          (output[0]?.error || ''),
      );
    return {
      cells: output,
      bounds,
      date,
      offset,
      event,
      model,
      fetched_at: new Date().toISOString(),
      version: 'rules-0.4-regional',
      mode: 'single-model',
      sampleCount: sets.reduce((n, c) => n + (c.points?.length || 0), 0),
    };
  }
  async function geocode(query) {
    if (query.trim().length < 2) throw Error('请输入至少两个字符');
    let failed = 0;
    try {
      const d = await json(
        'https://photon.komoot.io/api/?' +
          new URLSearchParams({ q: query, limit: 6 }),
        AbortSignal.timeout(25000),
      );
      if (d.features?.length)
        return {
          results: d.features.map((f) => {
            const p = f.properties;
            return {
              name:
                [
                  ...new Set(
                    [
                      'name',
                      'street',
                      'housenumber',
                      'city',
                      'state',
                      'country',
                    ]
                      .map((k) => p[k])
                      .filter(Boolean),
                  ),
                ].join(' · ') || query,
              latitude: f.geometry.coordinates[1],
              longitude: f.geometry.coordinates[0],
              source: 'Photon / OpenStreetMap',
            };
          }),
        };
    } catch {
      failed++;
    }
    try {
      const d = await json(
        'https://geocoding-api.open-meteo.com/v1/search?' +
          new URLSearchParams({
            name: query,
            count: 6,
            language: 'zh',
            format: 'json',
          }),
        AbortSignal.timeout(25000),
      );
      return {
        results: (d.results || []).map((p) => ({
          ...p,
          source: 'Open-Meteo / GeoNames',
          name: [
            ...new Set([p.name, p.admin1, p.country].filter(Boolean)),
          ].join(' · '),
        })),
      };
    } catch {
      failed++;
    }
    if (failed === 2) throw Error('地址服务暂不可用，请重试或手填坐标');
    return { results: [] };
  }
  const api = {
    regional,
    makeGrid,
    corridorClarity,
    beauty,
    astronomy,
    destination,
    score,
    weighted,
    aggregate,
    nearest,
    evaluateMember,
    forecast,
    geocode,
    members,
  };
  return api;
})();
export default Afterglow;
