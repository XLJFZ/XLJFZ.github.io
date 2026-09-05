import type { Metadata } from 'next';
import { PrintSizeCalculator } from '@/components/print-size-calculator';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: '打印尺寸计算器｜迅雷疾风',
  description:
    '根据照片像素、DPI 与纸张尺寸，计算最大打印尺寸、有效精度和裁切比例。',
  alternates: { canonical: '/tools/print-size/' },
};

export default function PrintSizePage() {
  return (
    <main id="top" className="min-h-screen bg-[#161615] text-white">
      <SiteHeader active="tools" />
      <div
        id="content"
        data-tool-content
        className="mx-auto max-w-[1400px] px-5 py-10 md:px-10 md:py-16"
      >
        <div className="mb-10 grid gap-5 border-t border-white/12 pt-5 md:grid-cols-[1fr_1.2fr] md:items-end">
          <div>
            <p className="text-xs tracking-[.2em] text-white/38">
              照片输出准备
            </p>
            <h1 className="mt-4 text-[clamp(2.4rem,5vw,4.8rem)] font-medium leading-none tracking-[-.055em]">
              打印尺寸计算器
            </h1>
          </div>
          <p className="max-w-xl text-base font-light leading-7 text-white/52 md:justify-self-end">
            输入照片像素，选择打印精度和纸张，立即判断清晰度是否足够、铺满是否需要裁切。
          </p>
        </div>
        <PrintSizeCalculator />
        <p className="mt-5 text-xs leading-5 text-white/35">
          结果按纸张物理尺寸估算，不包含打印机不可打印边距、出血和装裱余量；送印前请以输出机构要求为准。
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
