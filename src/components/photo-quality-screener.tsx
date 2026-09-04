'use client';

import { Download, ImagePlus, RotateCcw, ScanSearch } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  analyzePixels,
  findEmbeddedJpeg,
  groupDuplicates,
  isQualityPhoto,
  QUALITY_PRESETS,
  type QualityPreset,
} from '@/lib/photo-quality';

type Result = {
  name: string;
  size: number;
  width?: number;
  height?: number;
  blurVariance?: number;
  highlightRatio?: number;
  shadowRatio?: number;
  perceptualHash?: string;
  exactHash: string;
  error?: string;
};
const rawPattern = /\.(dng|nef|arw|cr2|raf|3fr|fff)$/i;

function percent(value?: number) {
  return value === undefined ? '—' : `${(value * 100).toFixed(2)}%`;
}
function csvCell(value: string | number | undefined) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function PhotoQualityScreener() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [preset, setPreset] = useState<QualityPreset>('推荐');
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const thresholds = QUALITY_PRESETS[preset];
  const duplicates = useMemo(
    () => groupDuplicates(results, thresholds.nearDuplicateDistance),
    [results, thresholds.nearDuplicateDistance],
  );

  const issues = (result: Result) => {
    const labels: string[] = [];
    if (result.error) labels.push('像素分析不可用');
    if (
      result.blurVariance !== undefined &&
      result.blurVariance < thresholds.blurVariance
    )
      labels.push('清晰度风险');
    if ((result.highlightRatio ?? 0) > thresholds.clippedRatio)
      labels.push('高光溢出');
    if ((result.shadowRatio ?? 0) > thresholds.clippedRatio)
      labels.push('暗部剪切');
    if (
      result.width &&
      result.height &&
      Math.max(result.width, result.height) < thresholds.minimumLongEdge
    )
      labels.push('低分辨率');
    return labels;
  };

  const add = (incoming: FileList | File[]) => {
    const all = Array.from(incoming);
    const supported = all.filter(isQualityPhoto);
    setFiles(supported);
    setResults([]);
    setProgress(0);
    setMessage(
      supported.length < all.length
        ? `已忽略 ${all.length - supported.length} 个不支持的文件。`
        : '',
    );
  };

  const run = async () => {
    setWorking(true);
    setResults([]);
    setProgress(0);
    setMessage('');
    const completed: Result[] = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      try {
        const source = await file.arrayBuffer();
        const digest = await crypto.subtle.digest('SHA-256', source);
        const exactHash = [...new Uint8Array(digest)]
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('');
        const embedded = rawPattern.test(file.name)
          ? findEmbeddedJpeg(source)
          : null;
        const blob = embedded
          ? new Blob([source.slice(embedded[0], embedded[1])], {
              type: 'image/jpeg',
            })
          : file;
        let bitmap: ImageBitmap | undefined;
        try {
          bitmap = await createImageBitmap(blob);
          const scale = Math.min(
            1,
            512 / Math.max(bitmap.width, bitmap.height),
          );
          const width = Math.max(9, Math.round(bitmap.width * scale));
          const height = Math.max(8, Math.round(bitmap.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (!context) throw new Error('浏览器无法建立像素画布');
          context.drawImage(bitmap, 0, 0, width, height);
          completed.push({
            name: file.name,
            size: file.size,
            width: bitmap.width,
            height: bitmap.height,
            exactHash,
            ...analyzePixels(
              context.getImageData(0, 0, width, height).data,
              width,
              height,
            ),
          });
        } catch {
          completed.push({
            name: file.name,
            size: file.size,
            exactHash,
            error: rawPattern.test(file.name)
              ? 'RAW 中没有找到浏览器可解码的内嵌预览'
              : '浏览器无法解码此图像',
          });
        } finally {
          bitmap?.close();
        }
      } catch {
        completed.push({
          name: file.name,
          size: file.size,
          exactHash: '',
          error: '读取文件失败',
        });
      }
      setProgress(index + 1);
      if (index % 2 === 0) await new Promise(requestAnimationFrame);
    }
    setResults(completed);
    setWorking(false);
  };

  const exportCsv = () => {
    const header = [
      '文件名',
      '像素尺寸',
      '清晰度方差',
      '高光溢出比例',
      '暗部剪切比例',
      '问题提示',
      '说明',
    ];
    const rows = results.map((r) => [
      r.name,
      r.width ? `${r.width}×${r.height}` : '',
      r.blurVariance?.toFixed(1) ?? '',
      percent(r.highlightRatio),
      percent(r.shadowRatio),
      issues(r).join('；'),
      r.error ?? '',
    ]);
    const url = URL.createObjectURL(
      new Blob(
        [
          '\uFEFF' +
            [header, ...rows]
              .map((row) => row.map(csvCell).join(','))
              .join('\r\n'),
        ],
        { type: 'text/csv;charset=utf-8' },
      ),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = '照片质量初筛报告.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const issueCount = results.filter((result) => issues(result).length).length;
  return (
    <section
      id="content"
      className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col px-5 py-8 md:px-10 md:py-12"
    >
      <div className="grid gap-8 border-t border-white/12 pt-5 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
        <div>
          <p className="text-xs tracking-[.2em] text-white/38">
            09 · LOCAL QUALITY SCREENING
          </p>
          <h1 className="mt-4 text-[clamp(2.6rem,5vw,5rem)] font-medium leading-none tracking-[-.055em]">
            照片质量初筛器
          </h1>
        </div>
        <p className="max-w-2xl text-sm font-light leading-7 text-white/52 lg:justify-self-end">
          照片逐张在浏览器本地分析，不上传、不修改原文件。结果是整理线索，不是审美评分，也不会自动删除、淘汰或覆盖照片。
        </p>
      </div>
      <div className="mt-10 grid min-h-[420px] overflow-hidden border border-white/12 bg-white/12 lg:grid-cols-[1.05fr_.95fr] lg:min-h-[520px] xl:min-h-[560px]">
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            add(event.dataTransfer.files);
          }}
          className="flex flex-col items-center justify-center bg-[#1b1b19] p-7 text-center"
        >
          <ScanSearch className="size-12 text-[#d8c19b]" strokeWidth={1.2} />
          <h2 className="mt-6 text-2xl">导入一批照片开始初筛</h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-white/45">
            JPEG、PNG、WebP、TIFF，以及 DNG、NEF、ARW、CR2、RAF、3FR/FFF。RAW
            使用内嵌预览；无可解码预览时会明确标出。
          </p>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/tiff,.dng,.nef,.arw,.cr2,.raf,.3fr,.fff"
            onChange={(event) => event.target.files && add(event.target.files)}
          />
          <Button className="mt-7" onClick={() => inputRef.current?.click()}>
            <ImagePlus />
            选择照片
          </Button>
          <p className="mt-5 text-xs text-white/35">
            已选择 {files.length} 张
            {working ? ` · 正在处理 ${progress}/${files.length}` : ''}
          </p>
        </div>
        <div className="flex flex-col bg-[#20201e] p-7 md:p-9">
          <p className="text-xs tracking-[.16em] text-white/38">筛选强度</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(Object.keys(QUALITY_PRESETS) as QualityPreset[]).map((name) => (
              <button
                key={name}
                onClick={() => setPreset(name)}
                className={`border px-3 py-3 text-sm ${preset === name ? 'border-[#d8c19b] bg-[#d8c19b] text-[#181816]' : 'border-white/12 text-white/55'}`}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="mt-7 space-y-3 border-t border-white/12 pt-5 text-sm leading-6 text-white/48">
            <p>清晰度：拉普拉斯方差低于 {thresholds.blurVariance}</p>
            <p>
              高光 / 暗部：纯白或纯黑像素超过{' '}
              {(thresholds.clippedRatio * 100).toFixed(0)}%
            </p>
            <p>分辨率：长边低于 {thresholds.minimumLongEdge}px</p>
            <p>
              近似重复：64 位感知哈希距离 ≤ {thresholds.nearDuplicateDistance}
            </p>
          </div>
          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            <Button
              disabled={!files.length || working}
              onClick={() => void run()}
            >
              开始本地分析
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFiles([]);
                setResults([]);
                setProgress(0);
                setMessage('');
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              <RotateCcw />
              清空
            </Button>
          </div>
          {message && <p className="mt-4 text-xs text-[#d8c19b]">{message}</p>}
        </div>
      </div>
      {results.length > 0 && (
        <div className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-5 border-b border-white/12 pb-5">
            <div>
              <p className="text-xs tracking-[.16em] text-white/38">筛选总览</p>
              <h2 className="mt-2 text-3xl">
                {results.length} 张 · {issueCount} 张有提示
              </h2>
              <p className="mt-2 text-sm text-white/42">
                完全重复 {duplicates.exactGroups.length} 组 · 近似重复{' '}
                {duplicates.nearGroups.length} 组
              </p>
            </div>
            <Button variant="outline" onClick={exportCsv}>
              <Download />
              导出 CSV 报告
            </Button>
          </div>
          {(duplicates.exactGroups.length > 0 ||
            duplicates.nearGroups.length > 0) && (
            <section className="mt-8 border border-white/10 bg-[#1c1c1a] p-6">
              <h3 className="text-xl">重复组</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {duplicates.exactGroups.map((group, i) => (
                  <div key={`e${i}`}>
                    <p className="text-xs text-[#d8c19b]">
                      完全重复 · SHA-256 一致
                    </p>
                    <p className="mt-2 text-sm text-white/55">
                      {group.map((r) => r.name).join(' / ')}
                    </p>
                  </div>
                ))}
                {duplicates.nearGroups.map((group, i) => (
                  <div key={`n${i}`}>
                    <p className="text-xs text-[#d8c19b]">
                      近似重复 · 感知哈希相近
                    </p>
                    <p className="mt-2 text-sm text-white/55">
                      {group.map((r) => r.name).join(' / ')}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
          <div className="mt-8 grid gap-px border border-white/12 bg-white/12">
            {results.map((result) => (
              <article
                key={result.name}
                className="grid gap-5 bg-[#191918] p-5 md:grid-cols-[1.2fr_repeat(4,.65fr)] md:items-center"
              >
                <div>
                  <h3 className="break-all text-sm">{result.name}</h3>
                  <p className="mt-2 text-xs text-[#d8c19b]">
                    {issues(result).join(' · ') || '未触发当前规则'}
                  </p>
                  {result.error && (
                    <p className="mt-2 text-xs text-white/35">{result.error}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] tracking-wider text-white/30">
                    像素
                  </p>
                  <p className="mt-1 text-sm tabular-nums">
                    {result.width ? `${result.width}×${result.height}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] tracking-wider text-white/30">
                    清晰度方差
                  </p>
                  <p className="mt-1 text-sm tabular-nums">
                    {result.blurVariance?.toFixed(1) ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] tracking-wider text-white/30">
                    高光溢出
                  </p>
                  <p className="mt-1 text-sm tabular-nums">
                    {percent(result.highlightRatio)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] tracking-wider text-white/30">
                    暗部剪切
                  </p>
                  <p className="mt-1 text-sm tabular-nums">
                    {percent(result.shadowRatio)}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-sm font-light leading-7 text-white/42">
            清晰度采用缩小预览上的拉普拉斯方差；曝光剪切统计接近纯白与纯黑的像素比例。长曝光、浅景深、夜景、高调或低调作品可能被规则误报，请结合创作意图保留自己的判断。RAW
            结果取决于相机写入的内嵌预览，不代表对传感器原始数据的完整显影。
          </p>
        </div>
      )}
    </section>
  );
}
