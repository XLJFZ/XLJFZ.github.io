'use client';

import { useRef, useState } from 'react';
import { Archive, Check, ImagePlus, LockKeyhole, Trash2 } from 'lucide-react';
import Compressor from 'compressorjs';
import { PrivacyNextStep } from '@/components/privacy-next-step';
import { Button } from '@/components/ui/button';
import { createZip, extractExifSegment } from '@/lib/jpeg-exif';

type Output = {
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

  const addFiles = (incoming: FileList | File[]) => {
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
    setOutputs([]);
    setError(
      photos.length < Array.from(incoming).length ? '已忽略非 JPEG 文件。' : '',
    );
  };

  const clear = () => {
    setFiles([]);
    setOutputs([]);
    setProgress(0);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const start = async () => {
    setIsWorking(true);
    setOutputs([]);
    setError('');
    setProgress(0);
    const completed: Output[] = [];
    const preset = presets.find((item) => item.id === presetId) ?? presets[1];
    try {
      for (let index = 0; index < files.length; index += 1) {
        completed.push(
          await compress(files[index], preset.maxEdge, preset.quality),
        );
        setOutputs([...completed]);
        setProgress(index + 1);
      }
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : '压缩过程中出现错误。',
      );
    } finally {
      setIsWorking(false);
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
  const saved =
    before > 0 && outputs.length === files.length ? 1 - after / before : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="border border-white/10 bg-[#1c1c1a]">
        <button
          type="button"
          className={`group flex min-h-72 w-full flex-col items-center justify-center px-6 text-center transition-colors ${isDragging ? 'bg-white/[.09]' : 'hover:bg-white/[.035]'}`}
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
              {files.map((file, index) => {
                const result = outputs[index];
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
                    setOutputs([]);
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

        <div className="mt-8 lg:mt-auto lg:pt-10">
          {isWorking && (
            <div className="mb-4" aria-live="polite">
              <div className="mb-2 flex justify-between text-xs text-white/45">
                <span>正在压缩</span>
                <span>
                  {progress}/{files.length}
                </span>
              </div>
              <div className="h-px bg-white/10">
                <div
                  className="h-px bg-white transition-[width]"
                  style={{ width: `${(progress / files.length) * 100}%` }}
                />
              </div>
            </div>
          )}
          {outputs.length === files.length && files.length > 0 ? (
            <>
              <div className="mb-4 flex items-end justify-between border-t border-white/10 pt-4">
                <span className="text-sm text-white/48">节省空间</span>
                <span className="text-3xl font-light tabular-nums">
                  {Math.max(0, saved * 100).toFixed(0)}%
                </span>
              </div>
              <Button className="h-12 w-full rounded-none" onClick={download}>
                <Archive className="size-4" /> 下载 ZIP
              </Button>
              <PrivacyNextStep />
            </>
          ) : (
            <Button
              className="h-12 w-full rounded-none"
              onClick={start}
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
