import type { Metadata } from 'next';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: '摄影工具｜迅雷疾风',
  description: '在浏览器本地完成摄影分析、照片输出准备与外拍规划。',
  alternates: { canonical: '/tools/' },
};

const tools = [
  {
    index: '01',
    eyebrow: '本地 EXIF 分析',
    title: '摄影习惯分析',
    description:
      '统计常用焦段、光圈、ISO、快门和拍摄时间，用真实拍摄频率判断一支镜头是不是刚需。',
    detail: '支持 JPEG、TIFF 与多种相机 RAW 格式',
    href: '/tools/photo-habits/',
  },
  {
    index: '02',
    eyebrow: '网站图片准备',
    title: '照片批量压缩',
    description:
      '批量缩小 JPEG 的尺寸与体积，同时保留相机、镜头和拍摄参数等 EXIF 信息。',
    detail: '不修改原文件，可一次下载全部结果',
    href: '/tools/image-compressor/',
  },
  {
    index: '03',
    eyebrow: '照片输出准备',
    title: '打印尺寸计算器',
    description:
      '根据照片像素、目标 DPI 与纸张尺寸，判断清晰度是否足够、铺满是否需要裁切。',
    detail: '支持 A 系列与常用相纸尺寸',
    href: '/tools/print-size/',
  },
  {
    index: '04',
    eyebrow: '外拍准备',
    title: '机位与光线规划器',
    description:
      '在地图上安排机位与被摄物，沿时间轴查看太阳、月亮、黄金时刻与焦段覆盖。',
    detail: '适合建筑、城市、风光与月升构图',
    href: '/tools/light-planner/',
  },
];

export default function ToolsPage() {
  return (
    <main id="top" className="min-h-screen bg-[#151514] text-white">
      <SiteHeader active="tools" />
      <section
        id="content"
        className="mx-auto max-w-[1500px] px-5 py-12 md:px-10 md:py-20"
      >
        <div className="grid gap-8 border-t border-white/12 pt-5 md:grid-cols-[1fr_1.15fr] md:items-end">
          <div>
            <p className="text-xs tracking-[.2em] text-white/38">
              PHOTOGRAPHY UTILITIES
            </p>
            <h1 className="mt-4 text-[clamp(2.8rem,6vw,6rem)] font-medium leading-none tracking-[-.06em]">
              摄影工具
            </h1>
          </div>
          <p className="max-w-xl text-base font-light leading-7 text-white/52 md:justify-self-end">
            为整理作品与理解拍摄习惯准备的小工具。照片只在你的浏览器中处理，不会上传到服务器。
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden border border-white/12 bg-white/12 md:mt-24 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              aria-label={`打开${tool.title}`}
              className="group flex min-h-[360px] flex-col bg-[#191918] p-6 transition-colors hover:bg-[#20201e] md:min-h-[430px] md:p-9"
            >
              <div className="flex items-center justify-between text-[10px] tracking-[.2em] text-white/35">
                <span>{tool.index}</span>
                <span>{tool.eyebrow}</span>
              </div>
              <div className="mt-auto pt-20">
                <h2 className="text-[clamp(2rem,4vw,3.8rem)] font-medium leading-none tracking-[-.055em]">
                  {tool.title}
                </h2>
                <p className="mt-6 max-w-lg text-sm font-light leading-7 text-white/52">
                  {tool.description}
                </p>
                <div className="mt-9 flex items-end justify-between gap-6 border-t border-white/12 pt-4">
                  <span className="text-[10px] leading-5 tracking-[.08em] text-white/35">
                    {tool.detail}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-xl text-white/65 transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
