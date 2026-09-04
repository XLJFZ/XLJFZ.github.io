import type { Metadata } from 'next';
import { ColorSampler } from '@/components/color-sampler';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: '色彩样本提取器｜迅雷疾风',
  description: '在浏览器本地提取单张与整组照片的主色、综合色板和明暗比例。',
  alternates: { canonical: '/tools/color-sampler/' },
};

export default function ColorSamplerPage() {
  return (
    <main id="top" className="min-h-screen bg-[#161615] text-white">
      <SiteHeader active="tools" />
      <div
        id="content"
        className="mx-auto w-full max-w-[1400px] px-5 py-10 md:px-10 md:py-16"
      >
        <div className="mb-9 grid gap-5 border-t border-white/12 pt-5 md:grid-cols-[1fr_1.15fr] md:items-end">
          <div>
            <p className="text-xs tracking-[.2em] text-white/38">
              系列编辑辅助
            </p>
            <h1 className="mt-4 text-[clamp(2.4rem,5vw,4.8rem)] font-medium leading-none tracking-[-.055em]">
              色彩样本提取器
            </h1>
          </div>
          <p className="max-w-xl text-base font-light leading-7 text-white/52 md:justify-self-end">
            比较单张与整组照片的颜色和明暗结构，为系列封面选择、页面底色与排版节奏提供参考。
          </p>
        </div>
        <ColorSampler />
      </div>
      <SiteFooter />
    </main>
  );
}
