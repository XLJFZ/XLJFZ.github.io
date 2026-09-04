'use client';

import { useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, RotateCcw } from 'lucide-react';
import {
  analyzePixels,
  combineSamples,
  type ColorSample,
} from '@/lib/color-sampler';

type PhotoResult = { name: string; sample: ColorSample };

async function sampleFile(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 180 / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('浏览器无法读取这张照片');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return analyzePixels(context.getImageData(0, 0, width, height).data);
}

function Palette({
  sample,
  large = false,
}: {
  sample: ColorSample;
  large?: boolean;
}) {
  return (
    <div
      className={`grid overflow-hidden border border-white/10 ${large ? 'h-28 grid-cols-8 md:h-36' : 'h-16 grid-cols-6'}`}
    >
      {sample.palette.map((color) => (
        <div
          key={color.hex}
          className="group relative"
          style={{ backgroundColor: color.hex }}
          title={`${color.hex} · ${(color.ratio * 100).toFixed(0)}%`}
        >
          <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-1 text-center text-[9px] tracking-wide text-white opacity-0 transition-opacity group-hover:opacity-100">
            {color.hex}
          </span>
        </div>
      ))}
    </div>
  );
}

function LightBar({ sample }: { sample: ColorSample }) {
  const entries = [
    ['暗部', sample.lightBalance.dark, '#35332f'],
    ['中间调', sample.lightBalance.mid, '#8c877d'],
    ['亮部', sample.lightBalance.light, '#ded8cc'],
  ] as const;
  return (
    <div>
      <div className="flex h-3 overflow-hidden bg-white/5">
        {entries.map(([label, value, color]) => (
          <div
            key={label}
            style={{ width: `${value * 100}%`, backgroundColor: color }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-[10px] tracking-[.08em] text-white/42">
        {entries.map(([label, value]) => (
          <span key={label}>
            {label} {(value * 100).toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}

export function ColorSampler() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<PhotoResult[]>([]);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  async function handleFiles(files: FileList | File[]) {
    const images = [...files].filter((file) => file.type.startsWith('image/'));
    if (!images.length) {
      setMessage('请选择浏览器可读取的图片文件。');
      return;
    }
    setWorking(true);
    setMessage('');
    const next: PhotoResult[] = [];
    for (const file of images) {
      try {
        next.push({ name: file.name, sample: await sampleFile(file) });
      } catch {
        setMessage(`有照片无法读取，已跳过：${file.name}`);
      }
    }
    setResults(next);
    setWorking(false);
  }

  const combined = results.length
    ? combineSamples(results.map((result) => result.sample))
    : null;

  return (
    <div className="space-y-6">
      <section className="grid min-h-[380px] overflow-hidden border border-white/10 bg-[#1c1b19] md:min-h-[440px] lg:grid-cols-[1.15fr_.85fr] lg:min-h-[520px]">
        <button
          type="button"
          className="flex min-h-[300px] flex-col items-center justify-center border-b border-white/10 px-6 text-center transition-colors hover:bg-white/[.025] lg:border-b-0 lg:border-r"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void handleFiles(event.dataTransfer.files);
          }}
        >
          {working ? (
            <LoaderCircle className="size-8 animate-spin text-[#d8c19b]" />
          ) : (
            <ImagePlus className="size-8 text-[#d8c19b]" />
          )}
          <span className="mt-6 text-2xl font-medium tracking-[-.03em]">
            {working ? '正在提取色彩' : '选择或拖入照片'}
          </span>
          <span className="mt-3 max-w-md text-sm font-light leading-6 text-white/45">
            支持一次导入一张或多张照片。计算只在当前浏览器中进行。
          </span>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) =>
              event.target.files && void handleFiles(event.target.files)
            }
          />
        </button>
        <aside className="flex flex-col justify-between p-6 md:p-8 lg:p-10">
          <div>
            <p className="text-xs tracking-[.16em] text-white/38">
              本地色彩阅读
            </p>
            <p className="mt-5 text-base font-light leading-7 text-white/55">
              用主色判断哪张更适合作为系列封面，用综合色板统一页面背景、文字和留白关系，再用明暗比例预估版面的视觉重量。
            </p>
          </div>
          <div className="mt-10 border-t border-white/10 pt-5 text-xs leading-6 text-white/38">
            <p>照片不会上传，原文件不会修改，也不会写入任何元数据。</p>
            <p className="mt-2">
              结果是缩小采样后的排版参考，细微颜色与专业色彩管理结果可能不同。
            </p>
          </div>
        </aside>
      </section>

      {message && (
        <output className="block text-sm text-[#d8c19b]">{message}</output>
      )}
      {combined && (
        <section
          className="border border-white/10 bg-[#24231f] p-6 md:p-9"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs tracking-[.16em] text-white/38">
                综合色板 · {results.length} 张照片
              </p>
              <h2 className="mt-3 text-3xl font-medium tracking-[-.04em] md:text-5xl">
                整组色彩基调
              </h2>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 border-b border-white/20 pb-1 text-xs text-white/48 hover:text-white"
              onClick={() => {
                setResults([]);
                setMessage('');
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              <RotateCcw className="size-3.5" />
              重新选择
            </button>
          </div>
          <div className="mt-8">
            <Palette sample={combined} large />
          </div>
          <div className="mt-7 max-w-2xl">
            <LightBar sample={combined} />
          </div>
        </section>
      )}

      {results.length > 0 && (
        <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-3">
          {results.map((result) => (
            <article key={result.name} className="bg-[#191918] p-5 md:p-6">
              <p className="truncate text-sm text-white/62" title={result.name}>
                {result.name}
              </p>
              <p className="mt-2 text-xs text-white/35">
                主色 {result.sample.palette[0]?.hex ?? '—'}
              </p>
              <div className="mt-5">
                <Palette sample={result.sample} />
              </div>
              <div className="mt-5">
                <LightBar sample={result.sample} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
