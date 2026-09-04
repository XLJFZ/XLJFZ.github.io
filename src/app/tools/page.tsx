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
    titleLines: ['摄影习惯', '分析'],
    description:
      '统计常用焦段、光圈、ISO、快门和拍摄时间，用真实拍摄频率判断一支镜头是不是刚需。',
    detail: '支持 JPEG、TIFF 与多种相机 RAW 格式',
    href: '/tools/photo-habits/',
  },
  {
    index: '02',
    eyebrow: '发布前隐私检查',
    title: '照片隐私检查器',
    titleLines: ['照片隐私', '检查器'],
    description:
      '检查 GPS、设备序列号、所有者、拍摄时间等 EXIF，并按勾选项生成清理副本。',
    detail: '支持 JPEG、JXL、HEIC、AVIF、WebP、TIFF',
    href: '/tools/exif-privacy/',
  },
  {
    index: '03',
    eyebrow: '网站图片准备',
    title: '照片批量压缩',
    titleLines: ['照片批量', '压缩'],
    description:
      '批量缩小 JPEG 的尺寸与体积，同时保留相机、镜头和拍摄参数等 EXIF 信息。',
    detail: '不修改原文件，可一次下载全部结果',
    href: '/tools/image-compressor/',
  },
  {
    index: '04',
    eyebrow: '系列编辑辅助',
    title: '色彩样本提取器',
    titleLines: ['色彩样本', '提取器'],
    description:
      '提取单张与整组照片的主色、综合色板和明暗比例，辅助系列封面选择与页面排版。',
    detail: '多张照片在浏览器本地综合色彩',
    href: '/tools/color-sampler/',
  },
  {
    index: '05',
    eyebrow: '照片输出准备',
    title: '打印尺寸计算器',
    titleLines: ['打印尺寸', '计算器'],
    description:
      '根据照片像素、目标 DPI 与纸张尺寸，判断清晰度是否足够、铺满是否需要裁切。',
    detail: '支持 A 系列与常用相纸尺寸',
    href: '/tools/print-size/',
  },
  {
    index: '06',
    eyebrow: '社交图片准备',
    title: '社交平台裁切预览器',
    titleLines: ['社交平台裁切', '预览器'],
    description:
      '同时预览方形、竖屏、横屏与宽幅构图，分别移动主体位置并按原图分辨率导出。',
    detail: '含 11 个常见比例与自定义比例',
    href: '/tools/social-crop/',
  },
  {
    index: '07',
    eyebrow: '外拍准备',
    title: '机位与光线规划器',
    titleLines: ['机位与光线', '规划器'],
    description:
      '在地图上安排机位与被摄物，沿时间轴查看太阳、月亮、黄金时刻与焦段覆盖。',
    detail: '适合建筑、城市、风光与月升构图',
    href: '/tools/light-planner/',
  },
  {
    index: '08',
    eyebrow: '本地整理工作流',
    title: '智能照片批量命名器',
    titleLines: ['智能照片', '批量命名器'],
    description:
      '读取可靠 EXIF，结合人工地点与受控主题词表，预览中英文文件名并下载不覆盖原图的副本。',
    detail: '中英文切换、重名检测与连续编号',
    href: '/tools/photo-renamer/',
  },
  {
    index: '09',
    eyebrow: '本地质量整理',
    title: '照片质量初筛器',
    titleLines: ['照片质量', '初筛器'],
    description:
      '批量检查清晰度、曝光剪切、像素尺寸与重复照片，用可解释的数值辅助人工选片。',
    detail: '支持常见图片与多种相机 RAW 格式',
    href: '/tools/photo-quality/',
  },
];

export default function ToolsPage() {
  return (
    <main id="top" className="min-h-screen bg-[#151514] text-white">
      <SiteHeader active="tools" />
      <section
        id="content"
        className="tools-index-content mx-auto flex w-full max-w-[1500px] flex-col px-5 py-12 md:px-10 md:py-20"
      >
        <div className="tools-index-intro grid gap-8 border-t border-white/12 pt-5 md:grid-cols-[1fr_1.15fr] md:items-end">
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

        <div className="tools-index-grid mt-16 grid gap-px overflow-hidden border border-white/12 bg-white/12 md:mt-24 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              aria-label={`打开${tool.title}`}
              className="tools-index-card group flex min-h-[360px] flex-col bg-[#191918] p-6 transition-colors hover:bg-[#20201e] md:min-h-[430px] md:p-9"
            >
              <div className="flex items-center justify-between text-[10px] tracking-[.2em] text-white/35">
                <span>{tool.index}</span>
                <span>{tool.eyebrow}</span>
              </div>
              <div className="tools-index-card-body mt-auto pt-20">
                <h2 className="tools-index-card-title min-h-[2em] text-[clamp(2rem,3.25vw,3.25rem)] font-medium leading-[.96] tracking-[-.055em]">
                  {tool.titleLines.map((line) => (
                    <span className="block" key={line}>
                      {line}
                    </span>
                  ))}
                </h2>
                <p className="tools-index-card-description mt-6 max-w-lg text-sm font-light leading-7 text-white/52">
                  {tool.description}
                </p>
                <div className="tools-index-card-detail mt-9 flex items-end justify-between gap-6 border-t border-white/12 pt-4">
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
