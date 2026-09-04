'use client';

import { useMemo, useState } from 'react';
import { Check, Crop, Ruler, TriangleAlert } from 'lucide-react';
import {
  calculatePrintFit,
  papers,
  recommendedPrintDpi,
  type Orientation,
} from '@/lib/print-size';

const number = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });

export function PrintSizeCalculator() {
  const [pixelWidth, setPixelWidth] = useState(6000);
  const [pixelHeight, setPixelHeight] = useState(4000);
  const [dpi, setDpi] = useState(300);
  const [paperId, setPaperId] = useState('a4');
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const paper = papers.find((item) => item.id === paperId) ?? papers[1];
  const recommendedDpi = recommendedPrintDpi(paper);
  const valid = pixelWidth > 0 && pixelHeight > 0 && dpi > 0;
  const result = useMemo(
    () =>
      valid
        ? calculatePrintFit({
            pixelWidth,
            pixelHeight,
            dpi,
            paper,
            orientation,
          })
        : null,
    [dpi, orientation, paper, pixelHeight, pixelWidth, valid],
  );

  const inputClass =
    'mt-2 h-12 w-full border border-white/15 bg-[#171715] px-4 text-base tabular-nums text-white outline-none transition-colors focus:border-white/55';

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)]">
      <section className="border border-white/10 bg-[#1c1c1a] p-5 md:p-8">
        <p className="text-xs tracking-[.18em] text-white/40">输入照片与纸张</p>
        <div className="mt-7 grid grid-cols-2 gap-4">
          <label className="text-sm text-white/62">
            像素宽度
            <input
              className={inputClass}
              type="number"
              min="1"
              step="1"
              value={pixelWidth}
              onChange={(event) => setPixelWidth(Number(event.target.value))}
            />
          </label>
          <label className="text-sm text-white/62">
            像素高度
            <input
              className={inputClass}
              type="number"
              min="1"
              step="1"
              value={pixelHeight}
              onChange={(event) => setPixelHeight(Number(event.target.value))}
            />
          </label>
        </div>

        <fieldset className="mt-7">
          <legend className="text-sm text-white/62">目标精度</legend>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[150, 200, 240, 300].map((value) => (
              <label
                key={value}
                className={`cursor-pointer border px-2 py-3 text-center text-sm tabular-nums transition-colors ${dpi === value ? 'border-white/55 bg-white/[.08] text-white' : 'border-white/10 text-white/45 hover:border-white/25'}`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="dpi"
                  checked={dpi === value}
                  onChange={() => setDpi(value)}
                />
                {value} DPI
                {recommendedDpi === value && (
                  <span className="mt-1 block text-[10px] tracking-[.08em] text-[#d8c19b]">
                    当前纸张建议
                  </span>
                )}
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-white/38">
            建议值已考虑成品尺寸与通常观看距离。精细近看可提高
            DPI，远观超大幅面可降低 DPI。
          </p>
        </fieldset>

        <div className="mt-7 grid gap-4 sm:grid-cols-[1fr_auto]">
          <label className="text-sm text-white/62">
            纸张尺寸
            <select
              className={inputClass}
              value={paperId}
              onChange={(event) => {
                const nextPaper =
                  papers.find((item) => item.id === event.target.value) ??
                  papers[1];
                setPaperId(nextPaper.id);
                setDpi(recommendedPrintDpi(nextPaper));
              }}
            >
              {papers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="text-sm text-white/62">方向</legend>
            <div className="mt-2 flex">
              {(['portrait', 'landscape'] as const).map((value) => (
                <label
                  key={value}
                  className={`flex h-12 cursor-pointer items-center border px-4 text-sm transition-colors ${orientation === value ? 'border-white/55 bg-white/[.08]' : 'border-white/10 text-white/45'}`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="orientation"
                    checked={orientation === value}
                    onChange={() => setOrientation(value)}
                  />
                  {value === 'portrait' ? '竖向' : '横向'}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section
        className="border border-white/10 bg-[#20201e] p-5 md:p-8"
        aria-live="polite"
      >
        {!result ? (
          <p className="text-sm text-[#e0a099]" role="alert">
            请输入大于 0 的像素尺寸和 DPI。
          </p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-7">
              <div>
                <p className="text-xs tracking-[.18em] text-white/40">
                  判断结果
                </p>
                <h2 className="mt-3 text-3xl font-medium tracking-[-.04em] md:text-4xl">
                  {result.hasEnoughPixels ? '可以打印' : '像素不足'}
                </h2>
              </div>
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-full border ${result.hasEnoughPixels ? 'border-[#b8c99d]/40 bg-[#b8c99d]/10 text-[#cbd8b8]' : 'border-[#e0a099]/40 bg-[#e0a099]/10 text-[#e0a099]'}`}
              >
                {result.hasEnoughPixels ? (
                  <Check className="size-5" aria-hidden="true" />
                ) : (
                  <TriangleAlert className="size-5" aria-hidden="true" />
                )}
              </span>
            </div>

            <div className="grid gap-px bg-white/10 sm:grid-cols-3">
              <Result
                label={`最大尺寸 · ${dpi} DPI`}
                value={`${number.format(result.maxWidthMm / 10)} × ${number.format(result.maxHeightMm / 10)} cm`}
              />
              <Result
                label={`${paper.label} 成品`}
                value={`${number.format(result.paperWidthMm / 10)} × ${number.format(result.paperHeightMm / 10)} cm`}
              />
              <Result
                label="铺满时实际精度"
                value={`${integer.format(result.effectiveDpi)} DPI`}
              />
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <div className="border border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <Ruler className="size-4 text-white/45" aria-hidden="true" />
                  <h3 className="text-sm">像素检查</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/52">
                  这张纸在 {dpi} DPI 下需要至少{' '}
                  <strong className="font-normal text-white">
                    {integer.format(result.requiredWidth)} ×{' '}
                    {integer.format(result.requiredHeight)} px
                  </strong>
                  。
                </p>
              </div>
              <div className="border border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <Crop className="size-4 text-white/45" aria-hidden="true" />
                  <h3 className="text-sm">裁切检查</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/52">
                  {result.needsCrop ? (
                    <>
                      铺满纸张需从
                      <strong className="font-normal text-white">
                        {result.cropAxis === 'width' ? '左右' : '上下'}共裁掉约{' '}
                        {number.format(result.cropPercent * 100)}%
                      </strong>
                      。
                    </>
                  ) : (
                    '照片与纸张比例接近，铺满时基本不需要裁切。'
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 border-l-2 border-[#d8c19b]/55 bg-white/[.035] px-5 py-4 text-sm leading-6 text-white/52">
              完整保留画面时，可在纸上印成{' '}
              <span className="text-white">
                {number.format(result.retainedWidthMm / 10)} ×{' '}
                {number.format(result.retainedHeightMm / 10)} cm
              </span>
              ，剩余区域留白。
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#20201e] py-6 sm:px-5">
      <p className="text-xs leading-5 text-white/38">{label}</p>
      <p className="mt-2 text-xl font-light tabular-nums tracking-[-.025em]">
        {value}
      </p>
    </div>
  );
}
