import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CopyEmailButton } from '@/components/copy-email-button';
import { getSeries } from '@/lib/portfolio';

export const metadata: Metadata = {
  title: '关于｜迅雷疾风',
  description: '关于迅雷疾风，以及建筑、城市、旅行与自然地景摄影实践。',
  alternates: { canonical: '/about/' },
};

export default function About() {
  const featuredSeries = getSeries('urban-pulse')!;
  const photograph = featuredSeries.images.find((image) =>
    image.src.includes('chongqing-zbz-9356-'),
  )!;

  return (
    <main id="top">
      <SiteHeader active="about" />
      <section
        id="content"
        className="mx-auto w-full max-w-[1480px] px-5 py-10 md:px-10 md:py-16 lg:px-14"
      >
        <div className="flex items-center justify-between gap-6 border-t border-foreground/15 pt-4 text-xs tracking-[.18em] text-foreground/60">
          <p>关于 · ABOUT</p>
          <p>光线 / 空间 / 时间</p>
        </div>
        <div className="mt-8 grid gap-10 md:mt-12 md:grid-cols-[.9fr_1.1fr] md:items-start md:gap-12 lg:gap-20">
          <figure className="m-0">
            <img
              src={photograph.src}
              width={photograph.width}
              height={photograph.height}
              alt={photograph.alt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-auto w-full bg-[#292824]"
            />
            <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs leading-5 text-foreground/65">
              <span>{photograph.caption}</span>
              <a
                href={`/series/${featuredSeries.slug}/`}
                className="border-b border-foreground/25 pb-1 transition-colors hover:border-foreground hover:text-foreground"
              >
                {featuredSeries.title} <span aria-hidden="true">↗</span>
              </a>
            </figcaption>
          </figure>
          <div className="md:pt-1">
            <p className="text-xs tracking-[.16em] text-foreground/60">
              在学习与行走之间
            </p>
            <h1 className="mt-4 text-[clamp(2.6rem,5vw,4.8rem)] font-medium leading-[1.12] tracking-[-.045em]">
              迅雷疾风
            </h1>
            <p className="mt-7 max-w-lg text-xl font-light leading-9 tracking-[-.02em] lg:text-2xl lg:leading-10">
              镜头不是答案，
              <br />
              而是持续观看世界的方式。
            </p>
            <div className="mt-6 max-w-xl space-y-4 text-sm font-light leading-7 text-foreground/75 lg:text-base lg:leading-8">
              <p>
                我是一名关注城市建筑与自然地景的摄影师，现就读于西安交通大学，在学习与行走之间记录光线、空间与时间。
              </p>
              <p>
                作品常从日常行走开始：城市中被忽略的转角、光落在材料上的几秒钟，以及天气将熟悉景观变得陌生的时刻。
              </p>
            </div>
            <dl className="mt-8 grid gap-5 border-t border-foreground/15 pt-5 text-sm leading-6 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              <div>
                <dt className="text-xs tracking-[.12em] text-foreground/60">
                  工作与生活
                </dt>
                <dd className="mt-2">上海 · 西安</dd>
              </div>
              <div>
                <dt className="text-xs tracking-[.12em] text-foreground/60">
                  拍摄方向
                </dt>
                <dd className="mt-2">建筑 · 风光 · 旅行 · 编辑</dd>
              </div>
            </dl>
            <div className="mt-8 border-t border-foreground/15 pt-5">
              <h2 className="text-base font-medium">让一次相遇，成为影像</h2>
              <p className="mt-3 text-sm leading-7 text-foreground/70">
                可接受拍摄委托，欢迎来信交流地点、想法与拍摄计划。
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4 text-sm">
                <a
                  href="mailto:zbzzzzzzz@qq.com"
                  className="inline-flex min-h-11 items-center gap-5 border border-foreground/25 bg-foreground/5 px-5 py-3 transition-opacity hover:opacity-80"
                >
                  邮件联系 <span aria-hidden="true">↗</span>
                </a>
                <CopyEmailButton className="min-h-11 text-sm font-normal">
                  zbzzzzzzz@qq.com
                </CopyEmailButton>
                <a
                  href="https://www.xiaohongshu.com/user/profile/61b4585d000000001000ea69"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center border-b border-foreground/25 transition-colors hover:border-foreground"
                >
                  小红书 ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
