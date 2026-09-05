'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, ImagePlus, LockKeyhole, RotateCcw } from 'lucide-react';
import { PrivacyNextStep } from '@/components/privacy-next-step';
import { ToolProgress } from '@/components/tool-progress';
import { Button } from '@/components/ui/button';
import { runPhotoBatch } from '@/lib/photo-batch';
import { encodeCrop } from '@/lib/crop-export';
import { createZip } from '@/lib/jpeg-exif';

type Ratio = {
  id: string;
  label: string;
  width: number;
  height: number;
  note: string;
};
type Position = { x: number; y: number };

const defaultRatios: Ratio[] = [
  { id: 'square', label: '1:1', width: 1, height: 1, note: '头像 / 方形帖文' },
  { id: 'portrait', label: '4:5', width: 4, height: 5, note: 'Instagram 竖图' },
  {
    id: 'vertical',
    label: '9:16',
    width: 9,
    height: 16,
    note: '短视频 / Story',
  },
  { id: 'five-seven', label: '5:7', width: 5, height: 7, note: '小红书竖图' },
  { id: 'classic', label: '4:3', width: 4, height: 3, note: '通用横图' },
  { id: 'photo', label: '3:2', width: 3, height: 2, note: '相机原生' },
  { id: 'wide', label: '16:9', width: 16, height: 9, note: '视频封面' },
  { id: 'screen', label: '16:10', width: 16, height: 10, note: '宽屏展示' },
  { id: 'social', label: '1.91:1', width: 1.91, height: 1, note: '链接分享图' },
  { id: 'banner', label: '65:24', width: 65, height: 24, note: '公众号封面' },
  { id: 'cinema', label: '2.35:1', width: 2.35, height: 1, note: '电影宽幅' },
];

const clamp = (value: number) => Math.max(0, Math.min(100, value));

function cropRect(image: HTMLImageElement, ratio: Ratio, position: Position) {
  const target = ratio.width / ratio.height;
  let width = image.naturalWidth;
  let height = width / target;
  if (height > image.naturalHeight) {
    height = image.naturalHeight;
    width = height * target;
  }
  return {
    x: ((image.naturalWidth - width) * position.x) / 100,
    y: ((image.naturalHeight - height) * position.y) / 100,
    width,
    height,
  };
}

function exportCrop(image: HTMLImageElement, ratio: Ratio, position: Position) {
  const crop = cropRect(image, ratio, position);
  return encodeCrop(image, crop);
}

export function SocialCropPreviewer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origin: Position;
  } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [customWidth, setCustomWidth] = useState('3');
  const [customHeight, setCustomHeight] = useState('1');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set([...defaultRatios.map((ratio) => ratio.id), 'custom']),
  );
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState<
    Array<{ name: string; data: Uint8Array; modified: Date }>
  >([]);
  useEffect(
    () => () => {
      controller.current?.abort();
      controller.current = null;
    },
    [],
  );

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const ratios = useMemo(() => {
    const width = Number(customWidth);
    const height = Number(customHeight);
    if (
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      width > 0 &&
      height > 0
    ) {
      return [
        ...defaultRatios,
        {
          id: 'custom',
          label: `${width}:${height}`,
          width,
          height,
          note: '自定义比例',
        },
      ];
    }
    return defaultRatios;
  }, [customWidth, customHeight]);

  const positionFor = (id: string) => positions[id] ?? { x: 50, y: 50 };
  const selectedRatios = ratios.filter((ratio) => selectedIds.has(ratio.id));

  const toggleRatio = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const choose = (next: File) => {
    if (controller.current) return;
    setReady([]);
    setNotice('');
    setHasDownloaded(false);
    if (!next.type.startsWith('image/'))
      return setError('请选择 JPG、PNG 或 WebP 图片。');
    if (url) URL.revokeObjectURL(url);
    setFile(next);
    setUrl(URL.createObjectURL(next));
    setPositions({});
    setError('');
  };

  const move = (id: string, next: Position) =>
    setPositions((current) => ({
      ...current,
      [id]: { x: clamp(next.x), y: clamp(next.y) },
    }));

  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || controller.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    move(drag.id, {
      x: drag.origin.x - ((event.clientX - drag.startX) / box.width) * 100,
      y: drag.origin.y - ((event.clientY - drag.startY) / box.height) * 100,
    });
  };

  const saveBlob = (blob: Blob, name: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setHasDownloaded(true);
  };

  const exportRatios = async (batch: Ratio[], single = false) => {
    if (controller.current || !imageRef.current || !file) return;
    const image = imageRef.current;
    const active = new AbortController();
    controller.current = active;
    setWorking(true);
    setError('');
    setNotice('');
    setReady([]);
    setProgress({ done: 0, total: batch.length });
    const outputs: Array<{ name: string; data: Uint8Array; modified: Date }> =
      [];
    try {
      const result = await runPhotoBatch(
        batch,
        async (ratio) => {
          const blob = await exportCrop(image, ratio, positionFor(ratio.id));
          if (active.signal.aborted) return;
          const data = new Uint8Array(await blob.arrayBuffer());
          if (active.signal.aborted) return;
          outputs.push({
            name:
              file.name.replace(/\.[^.]+$/, '') +
              '-' +
              ratio.id +
              '-' +
              ratio.label.replace(':', 'x') +
              '.jpg',
            data,
            modified: new Date(file.lastModified),
          });
          setReady([...outputs]);
        },
        active.signal,
        setProgress,
      );
      if (controller.current !== active) return;
      setError(
        result.failures
          .map(({ item, message }) => item.label + '：' + message)
          .join('；'),
      );
      setNotice(
        active.signal.aborted ? '已取消，可下载已完成的比例。' : '导出完成。',
      );
      if (!active.signal.aborted && outputs.length) {
        if (single)
          saveBlob(
            new Blob([new Uint8Array(outputs[0].data)], { type: 'image/jpeg' }),
            outputs[0].name,
          );
        else
          saveBlob(
            createZip(outputs),
            file.name.replace(/\.[^.]+$/, '') + '-social-crops.zip',
          );
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '导出失败。');
    } finally {
      if (controller.current === active) {
        controller.current = null;
        setWorking(false);
      }
    }
  };
  const downloadOne = (ratio: Ratio) => exportRatios([ratio], true);
  const downloadAll = () => exportRatios(selectedRatios);

  return (
    <div className="border border-white/10 bg-[#1b1b19]">
      <div className="grid gap-px bg-white/10 lg:grid-cols-[minmax(0,1fr)_310px]">
        <section className="bg-[#1b1b19] p-4 md:p-6">
          {!url ? (
            <button
              type="button"
              disabled={working}
              onClick={() => inputRef.current?.click()}
              className="group flex min-h-[420px] w-full flex-col items-center justify-center border border-dashed border-white/18 px-6 text-center transition-colors hover:bg-white/[.035]"
            >
              <span className="mb-5 flex size-14 items-center justify-center rounded-full border border-white/15 bg-white/[.035] transition-transform group-hover:-translate-y-1">
                <ImagePlus className="size-5" aria-hidden="true" />
              </span>
              <span className="text-xl">选择一张照片</span>
              <span className="mt-3 text-sm text-white/45">
                JPG、PNG 或 WebP，图片不会上传
              </span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {ratios.map((ratio) => {
                const position = positionFor(ratio.id);
                return (
                  <article
                    key={ratio.id}
                    className={`group border bg-[#111] transition-colors ${selectedIds.has(ratio.id) ? 'border-white/35' : 'border-white/10 opacity-55'}`}
                  >
                    <div
                      className="relative touch-none cursor-grab overflow-hidden active:cursor-grabbing"
                      style={{
                        aspectRatio: `${ratio.width} / ${ratio.height}`,
                      }}
                      onPointerDown={(event) => {
                        if (controller.current) return;
                        event.currentTarget.setPointerCapture(event.pointerId);
                        dragRef.current = {
                          id: ratio.id,
                          startX: event.clientX,
                          startY: event.clientY,
                          origin: position,
                        };
                      }}
                      onPointerMove={pointerMove}
                      onPointerUp={() => {
                        dragRef.current = null;
                      }}
                      onPointerCancel={() => {
                        dragRef.current = null;
                      }}
                    >
                      <img
                        src={url}
                        alt={`${ratio.label} 裁切预览`}
                        draggable={false}
                        className="h-full w-full select-none object-cover"
                        style={{
                          objectPosition: `${position.x}% ${position.y}%`,
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 border border-inset border-white/10" />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-3">
                      <label
                        aria-label={`选择导出 ${ratio.label}`}
                        className="flex min-w-0 cursor-pointer items-center gap-3"
                      >
                        <input
                          disabled={working}
                          type="checkbox"
                          checked={selectedIds.has(ratio.id)}
                          onChange={() => toggleRatio(ratio.id)}
                          className="size-4 shrink-0 accent-white"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm tabular-nums">
                            {ratio.label}
                          </span>
                          <span className="block truncate text-[11px] text-white/38">
                            {ratio.note}
                          </span>
                        </span>
                      </label>
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => downloadOne(ratio)}
                        className="flex size-9 shrink-0 items-center justify-center border border-white/10 text-white/48 transition-colors hover:border-white/30 hover:text-white"
                        aria-label={`导出 ${ratio.label}`}
                      >
                        <Download className="size-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <input
            disabled={working}
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={(event) =>
              event.target.files?.[0] && choose(event.target.files[0])
            }
          />
          {url && <img ref={imageRef} src={url} alt="" className="hidden" />}
        </section>

        <aside className="flex flex-col bg-[#20201e] p-5 md:p-6">
          <p className="text-xs tracking-[.18em] text-white/40">裁切设置</p>
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-white/72">选择导出比例</p>
              <div className="flex gap-3 text-xs text-white/45">
                <button
                  type="button"
                  disabled={working}
                  onClick={() =>
                    setSelectedIds(new Set(ratios.map((ratio) => ratio.id)))
                  }
                  className="hover:text-white"
                >
                  全选
                </button>
                <button
                  type="button"
                  disabled={working}
                  onClick={() => setSelectedIds(new Set())}
                  className="hover:text-white"
                >
                  清空
                </button>
              </div>
            </div>
            <p className="mt-6 text-sm text-white/72">自定义比例</p>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <label>
                <span className="sr-only">宽度比例</span>
                <input
                  disabled={working}
                  value={customWidth}
                  onChange={(event) => setCustomWidth(event.target.value)}
                  inputMode="decimal"
                  className="h-11 w-full border border-white/12 bg-black/15 px-3 text-center tabular-nums outline-none focus:border-white/45"
                />
              </label>
              <span className="text-white/35">:</span>
              <label>
                <span className="sr-only">高度比例</span>
                <input
                  disabled={working}
                  value={customHeight}
                  onChange={(event) => setCustomHeight(event.target.value)}
                  inputMode="decimal"
                  className="h-11 w-full border border-white/12 bg-black/15 px-3 text-center tabular-nums outline-none focus:border-white/45"
                />
              </label>
            </div>
          </div>
          <div className="mt-7 border-t border-white/10 pt-5 text-sm leading-6 text-white/50">
            <p>直接拖动每张预览，分别调整主体位置。</p>
            <p className="mt-3 flex items-start gap-3">
              <LockKeyhole
                className="mt-1 size-4 shrink-0"
                aria-hidden="true"
              />
              照片只在当前浏览器中读取与导出。
            </p>
          </div>
          {file && (
            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="truncate text-sm text-white/72">{file.name}</p>
              <button
                type="button"
                disabled={working}
                onClick={() => {
                  setPositions({});
                  setError('');
                }}
                className="mt-3 flex items-center gap-2 text-xs text-white/45 hover:text-white"
              >
                <RotateCcw className="size-3.5" />
                重置所有位置
              </button>
              <button
                type="button"
                disabled={working}
                onClick={() => inputRef.current?.click()}
                className="mt-3 text-xs text-white/45 hover:text-white"
              >
                换一张照片
              </button>
            </div>
          )}
          <section className="tool-result-panel mt-6">
            <p className="tool-result-summary">已生成 {ready.length} 个比例</p>
            <div className="mt-5 space-y-3 text-sm" aria-live="polite">
              {working && (
                <>
                  <ToolProgress
                    done={progress.done}
                    total={progress.total}
                    label="正在导出"
                  />
                  <Button
                    variant="ghost"
                    className="h-9 rounded-none px-0 text-xs text-white/60 hover:bg-transparent hover:text-white"
                    onClick={() => controller.current?.abort()}
                  >
                    取消导出
                  </Button>
                </>
              )}
              {!working && notice && <p>{notice}</p>}
              {!working && ready.length > 0 && (
                <Button
                  onClick={() => saveBlob(createZip(ready), 'social-crops.zip')}
                >
                  下载已完成的 {ready.length} 个比例
                </Button>
              )}
            </div>
            {error && (
              <p className="mt-5 text-sm text-[#e0a099]" role="alert">
                {error}
              </p>
            )}
            <div className="mt-5 border-t border-white/10 pt-5">
              <Button
                className="h-12 w-full rounded-none"
                variant={ready.length ? 'outline' : 'default'}
                onClick={downloadAll}
                disabled={!file || working || selectedRatios.length === 0}
              >
                <Download className="size-4" />
                {working
                  ? '正在导出…'
                  : selectedRatios.length
                    ? `导出已选 ${selectedRatios.length} 个比例`
                    : '请先选择比例'}
              </Button>
              <p className="mt-3 text-center text-[11px] leading-5 text-white/32">
                JPEG · 质量 92 · 保留原图可用分辨率
              </p>
              {hasDownloaded && <PrivacyNextStep />}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
