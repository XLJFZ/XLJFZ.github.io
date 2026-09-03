'use client';

import {
  Aperture,
  ChartNoAxesColumnIncreasing,
  Clock3,
  Gauge,
  ImagePlus,
  LockKeyhole,
  RotateCcw,
  ScanLine,
  Timer,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  analyzePhotos,
  evaluateLensNeed,
  type DistributionItem,
  type PhotoRecord,
} from '@/lib/photo-analysis';
import { isSupportedPhotoFile, parsePhotoMetadata } from '@/lib/photo-metadata';

const lensPresets = [
  { label: '14–24mm', min: 14, max: 24 },
  { label: '24–70mm', min: 24, max: 70 },
  { label: '70–200mm', min: 70, max: 200 },
  { label: '35mm', min: 30, max: 40 },
  { label: '50mm', min: 43, max: 58 },
  { label: '85mm', min: 72, max: 98 },
] as const;

type LensRange = { label: string; min: number; max: number };

function Distribution({ items }: { items: DistributionItem[] }) {
  const maximum = Math.max(...items.map((item) => item.count), 1);
  return (
    <div className="mt-6 space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
            <span className="text-white/68">{item.label}</span>
            <span className="tabular-nums text-white/40">
              {item.count} · {(item.percentage * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-[3px] overflow-hidden bg-white/[.08]">
            <div
              className="h-full bg-[#d8c19b] transition-[width] duration-500"
              style={{ width: `${(item.count / maximum) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  eyebrow,
  title,
  count,
  total,
  icon,
  items,
}: {
  eyebrow: string;
  title: string;
  count: number;
  total: number;
  icon: React.ReactNode;
  items: DistributionItem[];
}) {
  return (
    <section className="border border-white/10 bg-[#1c1c1a] p-5 md:p-6">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs tracking-[.16em] text-white/38">{eyebrow}</p>
          <h2 className="mt-3 text-xl tracking-[-.025em]">{title}</h2>
        </div>
        <span className="flex size-10 items-center justify-center rounded-full border border-white/10 text-[#d8c19b]">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xs text-white/32">
        {count}/{total} 张有可用数据
      </p>
      <Distribution items={items} />
    </section>
  );
}

export function PhotoHabitsAnalyzer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [records, setRecords] = useState<PhotoRecord[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [lens, setLens] = useState<LensRange>(lensPresets[2]);

  const analysis = useMemo(() => analyzePhotos(records), [records]);
  const advice = useMemo(
    () => evaluateLensNeed(analysis.focalLengths, lens),
    [analysis.focalLengths, lens],
  );

  const addFiles = (incoming: FileList | File[]) => {
    const all = Array.from(incoming);
    const supported = all.filter(isSupportedPhotoFile);
    if (!supported.length) {
      setError('没有找到可读取的 JPEG、TIFF、DNG、NEF、ARW 或 CR2 文件。');
      return;
    }
    setFiles((current) => {
      const known = new Set(
        current.map((file) => `${file.name}:${file.size}:${file.lastModified}`),
      );
      return [
        ...current,
        ...supported.filter(
          (file) =>
            !known.has(`${file.name}:${file.size}:${file.lastModified}`),
        ),
      ];
    });
    setRecords([]);
    setProgress(0);
    setError(
      supported.length < all.length
        ? `已忽略 ${all.length - supported.length} 个不支持的文件。`
        : '',
    );
  };

  const clear = () => {
    setFiles([]);
    setRecords([]);
    setProgress(0);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const start = async () => {
    setIsWorking(true);
    setRecords([]);
    setProgress(0);
    setError('');
    const completed: PhotoRecord[] = [];
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const source = await file.slice(0, 16 * 1024 * 1024).arrayBuffer();
        completed.push({
          name: file.name,
          metadata: parsePhotoMetadata(source),
        });
        setProgress(index + 1);
        if (index % 12 === 0) await new Promise(requestAnimationFrame);
      }
      setRecords(completed);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : '读取照片时出现错误。',
      );
    } finally {
      setIsWorking(false);
    }
  };

  const analyzed = records.length > 0;
  const missing = analyzed ? records.length - analysis.readable : 0;

  return (
    <div className="space-y-6">
      <section className="grid border border-white/10 bg-[#1b1b19] lg:grid-cols-[minmax(0,1fr)_360px]">
        <button
          type="button"
          className={`group flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center transition-colors md:min-h-72 ${isDragging ? 'bg-white/[.09]' : 'hover:bg-white/[.035]'}`}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setIsDragging(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <span className="mb-5 flex size-14 items-center justify-center rounded-full border border-white/15 bg-white/[.035] transition-transform group-hover:-translate-y-1">
            <ImagePlus className="size-5" aria-hidden="true" />
          </span>
          <span className="text-xl tracking-[-.02em]">拖入一批原片</span>
          <span className="mt-3 max-w-sm text-sm leading-6 text-white/42">
            支持 JPEG 及常见 TIFF 类 RAW：DNG、NEF、ARW、CR2
          </span>
        </button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/tiff,.jpg,.jpeg,.tif,.tiff,.dng,.nef,.arw,.cr2"
          multiple
          onChange={(event) =>
            event.target.files && addFiles(event.target.files)
          }
        />

        <aside className="flex flex-col border-t border-white/10 p-5 lg:border-l lg:border-t-0 lg:p-6">
          <div className="flex items-start gap-3 text-sm leading-6 text-white/58">
            <LockKeyhole
              className="mt-1 size-4 shrink-0 text-[#d8c19b]"
              aria-hidden="true"
            />
            <p>只在当前浏览器读取拍摄参数，照片不会上传，也不会生成缩略图。</p>
          </div>

          <div className="mt-7 border-t border-white/10 pt-5">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm text-white/48">已选择</p>
              <p className="text-3xl font-light tabular-nums">
                {files.length}
                <span className="ml-2 text-sm text-white/35">张</span>
              </p>
            </div>
            {files.length > 0 && (
              <button
                type="button"
                className="mt-3 flex items-center gap-2 text-sm text-white/42 transition-colors hover:text-white"
                onClick={clear}
                disabled={isWorking}
              >
                <RotateCcw className="size-3.5" aria-hidden="true" /> 清空重选
              </button>
            )}
          </div>

          {error && (
            <p className="mt-5 text-sm leading-6 text-[#e0a099]" role="alert">
              {error}
            </p>
          )}

          <div className="mt-8 lg:mt-auto lg:pt-8">
            {isWorking && (
              <div className="mb-4" aria-live="polite">
                <div className="mb-2 flex justify-between text-xs text-white/42">
                  <span>正在读取 EXIF</span>
                  <span className="tabular-nums">
                    {progress}/{files.length}
                  </span>
                </div>
                <div className="h-px bg-white/10">
                  <div
                    className="h-px bg-[#d8c19b] transition-[width]"
                    style={{
                      width: `${files.length ? (progress / files.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <Button
              className="h-12 w-full rounded-none"
              onClick={start}
              disabled={!files.length || isWorking}
            >
              <ScanLine className="size-4" />
              {isWorking
                ? '分析中…'
                : analyzed
                  ? '重新分析'
                  : `分析${files.length ? ` ${files.length} 张` : ''}`}
            </Button>
          </div>
        </aside>
      </section>

      {analyzed && (
        <div className="space-y-6" aria-live="polite">
          <section className="grid overflow-hidden border border-white/10 bg-[#24231f] lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="p-6 md:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-3 text-xs tracking-[.12em] text-white/38">
                <span>镜头购买判断</span>
                <span aria-hidden="true">·</span>
                <span>{analysis.focalCount} 张焦段样本</span>
              </div>
              <p
                className={`mt-7 max-w-3xl text-[clamp(2rem,4vw,4rem)] font-medium leading-[1.04] tracking-[-.045em] ${advice.tone === 'strong' ? 'text-[#e2cfaa]' : 'text-white'}`}
              >
                {advice.verdict}
              </p>
              <p className="mt-5 max-w-2xl text-base font-light leading-7 text-white/55">
                {advice.detail}
              </p>
              <div className="mt-8 grid max-w-xl grid-cols-2 gap-px bg-white/10 border border-white/10">
                <div className="bg-[#24231f] p-4">
                  <p className="text-xs text-white/36">落在目标焦段</p>
                  <p className="mt-2 text-2xl font-light tabular-nums">
                    {advice.inRange} 张
                  </p>
                </div>
                <div className="bg-[#24231f] p-4">
                  <p className="text-xs text-white/36">真实使用占比</p>
                  <p className="mt-2 text-2xl font-light tabular-nums">
                    {(advice.ratio * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            <aside className="border-t border-white/10 bg-black/10 p-6 lg:border-l lg:border-t-0 lg:p-8">
              <p className="text-xs tracking-[.16em] text-white/38">
                你考虑的镜头
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {lensPresets.map((preset) => {
                  const selected = preset.label === lens.label;
                  return (
                    <button
                      type="button"
                      key={preset.label}
                      className={`border px-3 py-2 text-sm transition-colors ${selected ? 'border-[#d8c19b] bg-[#d8c19b] text-[#1d1c18]' : 'border-white/12 text-white/52 hover:border-white/35 hover:text-white'}`}
                      onClick={() => setLens(preset)}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                <label className="text-xs text-white/42">
                  起始焦段
                  <input
                    className="mt-2 h-11 w-full border border-white/12 bg-black/15 px-3 text-base text-white outline-none transition-colors focus:border-white/45"
                    type="number"
                    min="1"
                    max="1200"
                    value={lens.min}
                    onChange={(event) => {
                      const min = Number(event.target.value);
                      setLens((current) => ({
                        ...current,
                        label: `${min}–${current.max}mm`,
                        min,
                      }));
                    }}
                  />
                </label>
                <span className="pb-3 text-white/28">—</span>
                <label className="text-xs text-white/42">
                  结束焦段
                  <input
                    className="mt-2 h-11 w-full border border-white/12 bg-black/15 px-3 text-base text-white outline-none transition-colors focus:border-white/45"
                    type="number"
                    min="1"
                    max="1200"
                    value={lens.max}
                    onChange={(event) => {
                      const max = Number(event.target.value);
                      setLens((current) => ({
                        ...current,
                        label: `${current.min}–${max}mm`,
                        max,
                      }));
                    }}
                  />
                </label>
              </div>
              <p className="mt-5 text-xs leading-5 text-white/34">
                定焦预设按相邻常用焦段留出小幅容差。结论只回答焦段需求，不评价画质、最大光圈、重量和预算。
              </p>
            </aside>
          </section>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              eyebrow="FOCAL LENGTH"
              title="焦段分布"
              count={analysis.focalCount}
              total={analysis.total}
              icon={<ChartNoAxesColumnIncreasing className="size-4" />}
              items={analysis.focal}
            />
            <StatCard
              eyebrow="APERTURE"
              title="常用光圈"
              count={analysis.apertureCount}
              total={analysis.total}
              icon={<Aperture className="size-4" />}
              items={analysis.aperture}
            />
            <StatCard
              eyebrow="SENSITIVITY"
              title="ISO 分布"
              count={analysis.isoCount}
              total={analysis.total}
              icon={<Gauge className="size-4" />}
              items={analysis.iso}
            />
            <StatCard
              eyebrow="SHUTTER"
              title="快门速度"
              count={analysis.shutterCount}
              total={analysis.total}
              icon={<Timer className="size-4" />}
              items={analysis.shutter}
            />
            <StatCard
              eyebrow="TIME OF DAY"
              title="拍摄时间"
              count={analysis.timeCount}
              total={analysis.total}
              icon={<Clock3 className="size-4" />}
              items={analysis.time}
            />
            <section className="flex flex-col border border-white/10 bg-[#171715] p-5 md:p-6">
              <p className="text-xs tracking-[.16em] text-white/38">
                数据完整度
              </p>
              <p className="mt-5 text-5xl font-light tracking-[-.05em] tabular-nums">
                {analysis.total
                  ? ((analysis.readable / analysis.total) * 100).toFixed(0)
                  : 0}
                %
              </p>
              <p className="mt-4 text-sm leading-6 text-white/48">
                {analysis.readable} 张读到至少一项拍摄参数；{missing}{' '}
                张没有可读取的 EXIF。缺失项未计入任何分布。
              </p>
              <p className="mt-auto pt-8 text-xs leading-5 text-[#d8c19b]/72">
                焦段统计优先使用 35mm
                等效焦段；原片未记录等效值时，才使用镜头实际焦距。
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
