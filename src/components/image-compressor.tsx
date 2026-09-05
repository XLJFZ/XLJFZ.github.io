'use client';

import { useEffect, useRef, useState } from 'react';
import { Archive, Check, ImagePlus, LockKeyhole, Trash2 } from 'lucide-react';
import Compressor from 'compressorjs';
import { PrivacyNextStep } from '@/components/privacy-next-step';
import { ToolProgress } from '@/components/tool-progress';
import { Button } from '@/components/ui/button';
import { runPhotoBatch } from '@/lib/photo-batch';
import { createZip, extractExifSegment } from '@/lib/jpeg-exif';

type Output = {
  file: File;
  name: string;
  data: Uint8Array;
  before: number;
  after: number;
  modified: Date;
  exif: boolean;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const presets = [
  { id: 'light', label: '轻量', note: '文章配图', maxEdge: 1600, quality: 76 },
  {
    id: 'balanced',
    label: '推荐',
    note: '摄影网站',
    maxEdge: 2400,
    quality: 82,
  },
  { id: 'large', label: '大图', note: '全屏查看', maxEdge: 3200, quality: 86 },
] as const;

function outputName(name: string) {
  return `${name.replace(/\.(jpe?g)$/i, '')}-web.jpg`;
}

async function compress(file: File, maxEdge: number, quality: number) {
  const source = await file.arrayBuffer();
  const exif = extractExifSegment(source);
  const blob = await new Promise<Blob>(
    (resolve, reject) =>
      new Compressor(file, {
        maxWidth: maxEdge,
        maxHeight: maxEdge,
        quality: quality / 100,
        mimeType: 'image/jpeg',
        retainExif: true,
        checkOrientation: true,
        strict: false,
        success: resolve,
        error: reject,
      }),
  );
  const data = new Uint8Array(await blob.arrayBuffer());
  return {
    file,
    name: outputName(file.name),
    data,
    before: file.size,
    after: data.length,
    modified: new Date(file.lastModified),
    exif: Boolean(exif),
  } satisfies Output;
}

export function ImageCompressor() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [presetId, setPresetId] =
    useState<(typeof presets)[number]['id']>('balanced');
  const [isDragging, setIsDragging] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const [batchTotal, setBatchTotal] = useState(0);
  const [failures, setFailures] = useState<
    Array<{ item: File; message: string }>
  >([]);
  const [pending, setPending] = useState<File[]>([]);
  const [notice, setNotice] = useState('');
  useEffect(
    () => () => {
      controller.current?.abort();
      controller.current = null;
    },
    [],
  );
  const resetResults = () => {
    setOutputs([]);
    setFailures([]);
    setPending([]);
    setNotice('');
    setProgress(0);
  };

  const addFiles = (incoming: FileList | File[]) => {
    if (controller.current) return;
    const photos = Array.from(incoming).filter((file) =>
      /image\/jpeg/i.test(file.type),
    );
    if (!photos.length) {
      setError('请选择 JPG 或 JPEG 照片。');
      return;
    }
    setFiles((current) => {
      const known = new Set(current.map((file) => `${file.name}:${file.size}`));
      return [
        ...current,
        ...photos.filter((file) => !known.has(`${file.name}:${file.size}`)),
      ];
    });
    resetResults();
    setError(
      photos.length < Array.from(incoming).length ? '已忽略非 JPEG 文件。' : '',
    );
  };

  const clear = () => {
    if (controller.current) return;
    setFiles([]);
    resetResults();
    setProgress(0);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const start = async (batch = files, retry = false) => {
    if (controller.current || !batch.length) return;
    const active = new AbortController();
    controller.current = active;
    const retainedFailures = retry
      ? failures.filter(({ item }) => !batch.includes(item))
      : [];
    const retainedPending = retry
      ? pending.filter((item) => !batch.includes(item))
      : [];
    if (!retry) setOutputs([]);
    setFailures(retainedFailures);
    setPending(retainedPending);
    setIsWorking(true);
    setError('');
    setNotice('');
    setProgress(0);
    setBatchTotal(batch.length);
    const preset = presets.find((item) => item.id === presetId) ?? presets[1];
    try {
      const result = await runPhotoBatch(
        batch,
        async (file) => {
          const output = await compress(file, preset.maxEdge, preset.quality);
          if (active.signal.aborted) return;
          setOutputs((current) => [
            ...current.filter((item) => item.file !== file),
            output,
          ]);
        },
        active.signal,
        ({ done }) => setProgress(done),
      );
      if (controller.current !== active) return;
      setFailures([...retainedFailures, ...result.failures]);
      setPending([...retainedPending, ...result.pending]);
      setNotice(
        active.signal.aborted
          ? '已取消，成功结果已保留。'
          : '处理结束，可下载成功结果。',
      );
    } finally {
      if (controller.current === active) {
        controller.current = null;
        setIsWorking(false);
      }
    }
  };

  const download = () => {
    const zip = createZip(outputs);
    const url = URL.createObjectURL(zip);
    const link = document.createElement('a');
    link.href = url;
    link.download = `web-photos-${new Date().toISOString().slice(0, 10)}.zip`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const before = files.reduce((sum, file) => sum + file.size, 0);
  const after = outputs.reduce((sum, file) => sum + file.after, 0);
  const completedBefore = outputs.reduce(
    (sum, output) => sum + output.before,
    0,
  );
  const saved = completedBefore > 0 ? 1 - after / completedBefore : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="border border-white/10 bg-[#1c1c1a]">
        <button
          type="button"
          className={`group flex min-h-72 w-full flex-col items-center justify-center px-6 text-center transition-colors ${isDragging ? 'bg-white/[.09]' : 'hover:bg-white/[.035]'}`}
          disabled={isWorking}
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
          <span className="text-xl tracking-[-.02em]">拖入 JPEG 照片</span>
          <span className="mt-3 text-sm text-white/45">
            或点击选择，可一次添加多张
          </span>
        </button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,.jpg,.jpeg"
          disabled={isWorking}
          multiple
          onChange={(event) =>
            event.target.files && addFiles(event.target.files)
          }
        />

        {files.length > 0 && (
          <div className="border-t border-white/10">
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-sm">
                {files.length} 张照片 · {formatBytes(before)}
              </p>
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-white/45 transition-colors hover:text-white"
                onClick={clear}
                disabled={isWorking}
              >
                <Trash2 className="size-4" aria-hidden="true" /> 清空
              </button>
            </div>
            <ul className="max-h-64 divide-y divide-white/[.07] overflow-auto border-t border-white/[.07]">
              {files.map((file) => {
                const result = outputs.find((output) => output.file === file);
                return (
                  <li
                    key={`${file.name}-${file.size}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 text-sm"
                  >
                    <span className="truncate text-white/72">{file.name}</span>
                    <span className="flex items-center gap-3 text-xs text-white/38">
                      {result ? (
                        <>
                          {formatBytes(result.after)}
                          <Check
                            className="size-4 text-[#b8c99d]"
                            aria-label="已完成"
                          />
                        </>
                      ) : (
                        formatBytes(file.size)
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <aside className="flex flex-col border border-white/10 bg-[#20201e] p-5 md:p-6">
        <p className="text-xs tracking-[.18em] text-white/40">导出设置</p>
        <fieldset className="mt-5 grid gap-2">
          <legend className="sr-only">压缩方案</legend>
          {presets.map((preset) => {
            const selected = preset.id === presetId;
            return (
              <label
                key={preset.id}
                aria-label={`${preset.label}：${preset.maxEdge} 像素，质量 ${preset.quality}`}
                className={`grid cursor-pointer grid-cols-[1fr_auto] items-center border px-4 py-3 text-left transition-colors ${selected ? 'border-white/55 bg-white/[.07]' : 'border-white/10 text-white/55 hover:border-white/25'}`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="compression-preset"
                  value={preset.id}
                  checked={selected}
                  onChange={() => {
                    setPresetId(preset.id);
                    resetResults();
                  }}
                  disabled={isWorking}
                />
                <span>
                  <span className="block text-sm text-white">
                    {preset.label}
                  </span>
                  <span className="mt-1 block text-xs">{preset.note}</span>
                </span>
                <span className="text-right text-xs tabular-nums">
                  <span className="block text-white/72">
                    {preset.maxEdge}px
                  </span>
                  <span className="mt-1 block">质量 {preset.quality}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className="mt-8 border-t border-white/10 pt-5 text-sm leading-6 text-white/52">
          <p className="flex items-start gap-3">
            <LockKeyhole className="mt-1 size-4 shrink-0" aria-hidden="true" />
            全程在本机处理，照片不会上传。
          </p>
          <p className="mt-3 pl-7 text-xs leading-5 text-[#d4c29e]">
            EXIF 会完整保留，包括原片中已有的拍摄位置等信息。
          </p>
        </div>

        {error && (
          <p className="mt-5 text-sm text-[#e0a099]" role="alert">
            {error}
          </p>
        )}

        <div className="tool-result-panel mt-8 lg:mt-auto">
          <p className="tool-result-summary">
            已完成 {outputs.length} / {files.length} 张
          </p>
          {isWorking && (
            <ToolProgress done={progress} total={batchTotal} label="正在压缩" />
          )}
          <div className="mb-4 space-y-3 text-sm" aria-live="polite">
            {isWorking && (
              <Button
                variant="ghost"
                className="h-9 rounded-none px-0 text-xs text-white/60 hover:bg-transparent hover:text-white"
                onClick={() => controller.current?.abort()}
              >
                取消处理
              </Button>
            )}
            {!isWorking && notice && <p>{notice}</p>}
            {failures.length > 0 && (
              <>
                <ul className="max-h-48 overflow-auto text-[#e0a099]">
                  {failures.map(({ item, message }, index) => (
                    <li className="break-all" key={index}>
                      {item.name}：{message}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="min-h-10 rounded-none border-white/20 bg-transparent text-white/75"
                  disabled={isWorking}
                  onClick={() =>
                    void start(
                      failures.map(({ item }) => item),
                      true,
                    )
                  }
                >
                  重试失败项
                </Button>
              </>
            )}
            {pending.length > 0 && (
              <Button
                variant="outline"
                className="min-h-10 rounded-none border-white/20 bg-transparent text-white/75"
                disabled={isWorking}
                onClick={() => void start(pending, true)}
              >
                继续剩余 {pending.length} 张
              </Button>
            )}
          </div>
          {outputs.length > 0 ? (
            <>
              <div className="mb-4 flex items-end justify-between border-t border-white/10 pt-4">
                <span className="text-sm text-white/48">成功照片节省空间</span>
                <span className="text-3xl font-light tabular-nums">
                  {Math.max(0, saved * 100).toFixed(0)}%
                </span>
              </div>
              <Button
                className="h-12 w-full rounded-none"
                onClick={download}
                disabled={isWorking}
              >
                <Archive className="size-4" /> 下载成功的 {outputs.length} 张
                ZIP
              </Button>
              <PrivacyNextStep />
            </>
          ) : (
            <Button
              className="h-12 w-full rounded-none"
              onClick={() => void start()}
              disabled={!files.length || isWorking}
            >
              {isWorking
                ? '处理中…'
                : `压缩${files.length ? ` ${files.length} 张` : ''}`}
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}
