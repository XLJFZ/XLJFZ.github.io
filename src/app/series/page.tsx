import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { series } from '@/lib/portfolio';

export const metadata: Metadata = {
  title: '作品系列｜迅雷疾风',
  description: '浏览迅雷疾风的城市、风光与人文摄影专题。',
  alternates: { canonical: '/series/' },
};

export default function SeriesIndex() {
  return (
    <main id="top">
      <SiteHeader active="series" />
      <section
        id="content"
        className="mx-auto w-full max-w-[1600px] px-5 pb-20 pt-12 md:px-10 md:pb-24 md:pt-16"
      >
        <div className="mb-14 grid gap-6 md:grid-cols-2 md:items-end">
          <h1 className="text-[clamp(2.8rem,6.5vw,5.8rem)] font-medium leading-none tracking-[-0.055em]">
            作品系列
          </h1>
          <p className="max-w-md text-sm font-light leading-7 text-foreground/70 md:justify-self-end">
            从城市街巷到高原腹地，在建筑、地景与日常之间观察光线和时间。
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 md:gap-y-16 lg:gap-x-12">
          {series.map((item, index) => {
            return (
              <a
                href={`/series/${item.slug}/`}
                key={item.slug}
                className="group flex min-w-0 flex-col"
              >
                <div className="relative overflow-hidden bg-[#292824] shadow-[0_24px_80px_rgba(0,0,0,.28)]">
                  <img
                    src={item.preview.mobilePath}
                    srcSet={`${item.preview.mobilePath} ${item.preview.mobileWidth}w, ${item.preview.path} ${item.preview.width}w`}
                    sizes="(min-width: 1600px) 736px, (min-width: 1024px) calc((100vw - 128px) / 2), (min-width: 768px) calc((100vw - 112px) / 2), calc(100vw - 40px)"
                    width={item.preview.width}
                    height={item.preview.height}
                    alt={item.title}
                    loading={index < 2 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    decoding="async"
                    className="aspect-[16/10] w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.025]"
                    style={{ objectPosition: item.coverPosition ?? 'center' }}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                  <span className="absolute left-4 top-4 border border-white/30 bg-black/30 px-2.5 py-1 text-xs tracking-[.16em] text-white backdrop-blur-sm md:left-5 md:top-5">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex flex-1 flex-col pt-5">
                  <p className="text-xs leading-5 tracking-[.1em] text-foreground/65">
                    {item.category} · {item.year} · {item.images.length} 幅
                  </p>
                  <h2 className="mt-3 text-3xl font-medium leading-tight tracking-[-0.04em] lg:text-4xl">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 tracking-[.05em] text-foreground/65">
                    {item.englishTitle}
                  </p>
                  <div className="mt-auto pt-5">
                    <div className="flex items-start justify-between gap-5 border-t border-foreground/15 pt-4">
                      <p className="max-w-lg text-xs leading-6 tracking-[.05em] text-foreground/65">
                        {item.location}
                      </p>
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-lg text-foreground/75 transition-transform duration-300 group-hover:translate-x-1"
                      >
                        ↗
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
