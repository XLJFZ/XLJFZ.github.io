import type { Metadata } from 'next';

import { LightPlanner } from '@/components/light-planner';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: '机位与光线规划器｜迅雷疾风',
  description:
    '在地图上规划建筑、城市与风光摄影机位，查看太阳、月亮、黄金时刻、蓝调时刻与焦段覆盖。',
  alternates: { canonical: '/tools/light-planner/' },
};

export default function LightPlannerPage() {
  return (
    <main id="top" className="min-h-screen bg-[#111210] text-white">
      <SiteHeader active="tools" />
      <div
        id="content"
        className="mx-auto max-w-[1600px] px-4 py-7 md:px-10 md:py-10"
      >
        <div className="mb-6 grid gap-4 border-t border-white/12 pt-4 md:grid-cols-[1fr_1.2fr] md:items-end">
          <div>
            <p className="text-xs tracking-[.2em] text-white/38">外拍准备</p>
            <h1 className="mt-3 text-[clamp(2.2rem,4.5vw,4.4rem)] font-medium leading-none tracking-[-.055em]">
              机位与光线规划器
            </h1>
          </div>
          <p className="max-w-xl text-sm font-light leading-7 text-white/48 md:justify-self-end md:text-base">
            去哪里站，什么时候去，光从哪边来，带什么焦段。
          </p>
        </div>
        <LightPlanner />
        <nav
          aria-label="其他摄影工具"
          className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/42"
        >
          <a
            className="border-b border-white/20 pb-1 transition-colors hover:border-white hover:text-white"
            href="/tools/photo-habits/"
          >
            摄影习惯分析 →
          </a>
          <a
            className="border-b border-white/20 pb-1 transition-colors hover:border-white hover:text-white"
            href="/tools/image-compressor/"
          >
            照片批量压缩 →
          </a>
        </nav>
      </div>
      <SiteFooter />
    </main>
  );
}
