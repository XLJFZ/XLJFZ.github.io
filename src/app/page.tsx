import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { series } from '@/lib/portfolio';

export default function Home() {
  return (
    <main id="top">
      <section
        id="content"
        className="relative flex min-h-[100svh] flex-col overflow-hidden bg-neutral-950 text-white"
      >
        <SiteHeader />
        <img
          src="/hero-previews/hero-zbz-2714-1280.jpg"
          srcSet="/hero-previews/hero-zbz-2714-1280.jpg 1280w, /hero-previews/hero-zbz-2714-2200.jpg 2200w"
          sizes="100vw"
          alt="暮色中的雪山群峰与湖面倒影"
          width="3000"
          height="1717"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="hero-image absolute inset-0 h-full w-full scale-[1.02] object-cover opacity-95"
          style={{ filter: 'saturate(1.14) contrast(1.02)' }}
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,18,.18)_0%,transparent_35%,rgba(8,10,18,.18)_52%,rgba(8,10,18,.72)_78%,rgba(8,10,18,.88)_100%)]"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto mt-auto w-full max-w-[1600px] px-5 pb-5 pt-40 md:px-10 md:pb-7 md:pt-52">
          <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
            <div className="max-w-3xl">
              <p className="mb-4 flex items-center gap-3 text-xs tracking-[.18em] text-white/75">
                <span className="inline-block h-px w-8 bg-white/45" />
                风光 · 建筑 · 在路上
              </p>
              <h1 className="text-[clamp(2.5rem,5.6vw,5.6rem)] font-medium leading-[1.12] tracking-[-0.035em]">
                风从群山来
              </h1>
              <p className="mt-5 max-w-md text-sm font-light leading-7 text-white/80">
                在抵达与离开之间，记录光线、天气和地景短暂相遇的瞬间。
              </p>
            </div>
            <a
              href="/series/"
              className="group inline-flex min-h-11 w-fit items-center gap-8 border-b border-white/45 pb-2 text-sm tracking-[.12em] transition-colors hover:border-white md:mb-1"
            >
              浏览作品{' '}
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/25 pt-3 md:mt-10 md:pt-4">
            <p className="text-xs leading-6 tracking-[.08em] text-white/70">
              德钦 · 雪达湖 · 2025
            </p>
            <a
              href="#selected-series"
              className="group inline-flex min-h-11 items-center gap-3 text-xs tracking-[.1em] text-white/80 transition-colors hover:text-white"
            >
              向下探索{' '}
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-y-1 motion-reduce:transform-none"
              >
                ↓
              </span>
            </a>
          </div>
        </div>
      </section>

      <section
        id="selected-series"
        aria-label="精选系列"
        className="mx-auto w-full max-w-[1600px] scroll-mt-20 px-5 py-14 md:scroll-mt-28 md:px-10 md:py-20"
      >
        <div className="mb-10 grid gap-7 md:mb-14 md:grid-cols-[1fr_1.2fr] md:items-start">
          <p className="text-xs leading-5 tracking-[0.16em] text-foreground/65">
            精选系列 · 01—{String(series.length).padStart(2, '0')}
          </p>
          <p className="max-w-xl text-lg font-light leading-8 tracking-[-0.02em] md:justify-self-end md:text-xl md:leading-9">
            在城市的秩序与自然的偶然之间，寻找安静、准确而有余韵的画面。
          </p>
        </div>

        <div className="space-y-20 md:space-y-28">
          {series.map((item, index) => {
            return (
              <a
                href={`/series/${item.slug}/`}
                key={item.slug}
                className={`group grid gap-5 md:items-end md:gap-10 ${index % 2 ? 'md:grid-cols-[.55fr_1.45fr]' : 'md:grid-cols-[1.45fr_.55fr]'}`}
              >
                <div
                  className={`relative overflow-hidden bg-[#292824] shadow-[0_22px_70px_rgba(0,0,0,.28)] ${index % 2 ? 'md:order-2' : ''}`}
                >
                  <img
                    src={item.preview.mobilePath}
                    srcSet={`${item.preview.mobilePath} ${item.preview.mobileWidth}w, ${item.preview.path} ${item.preview.width}w`}
                    sizes="(min-width: 1600px) 1130px, (min-width: 768px) 71vw, calc(100vw - 40px)"
                    width={item.preview.width}
                    height={item.preview.height}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[16/10] w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.025]"
                    style={{ objectPosition: item.coverPosition ?? 'center' }}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                  <span className="absolute left-4 top-4 border border-white/30 bg-black/15 px-2.5 py-1 text-[9px] tracking-[.2em] text-white backdrop-blur-sm md:left-5 md:top-5">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className={index % 2 ? 'md:order-1' : ''}>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-foreground/10 pt-3 text-xs leading-5 tracking-[.08em] text-foreground/65">
                    <span className="whitespace-nowrap">
                      {String(index + 1).padStart(2, '0')} · {item.category}
                      {' · '}
                      {item.images.length} 幅
                    </span>
                    <span className="whitespace-nowrap">{item.year}</span>
                  </div>
                  <h2 className="mt-5 text-4xl font-medium leading-tight tracking-[-.05em] md:text-[clamp(1.5rem,3vw,3rem)]">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 tracking-[.05em] text-foreground/65">
                    {item.englishTitle}
                  </p>
                  <p className="mt-6 max-w-sm text-sm font-light leading-7 text-foreground/70">
                    {item.statement}
                  </p>
                  <p className="mt-4 text-xs leading-6 tracking-[.05em] text-foreground/65">
                    {item.location}
                  </p>
                  <span className="mt-7 inline-flex items-center gap-4 text-xs tracking-[.1em]">
                    进入系列{' '}
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="collaboration-title"
        className="border-t border-white/10 bg-[#181817] text-white"
      >
        <div className="mx-auto grid w-full max-w-[1600px] gap-9 px-5 py-14 md:grid-cols-[1.1fr_.9fr] md:items-end md:gap-12 md:px-10 md:py-20 lg:gap-20">
          <div>
            <p className="mb-5 text-xs tracking-[.16em] text-white/65">
              合作与委托
            </p>
            <h2
              id="collaboration-title"
              className="text-[clamp(2rem,4vw,4.25rem)] font-medium leading-[1.2] tracking-[-.04em]"
            >
              让影像保持呼吸
            </h2>
            <p className="mt-6 text-xs leading-6 tracking-[.12em] text-white/65">
              建筑 · 风光 · 旅行 · 编辑
            </p>
          </div>
          <div className="w-full max-w-lg md:justify-self-end">
            <p className="text-sm font-light leading-7 text-white/75 md:text-base md:leading-8">
              若你有一个等待被看见的地点，欢迎来信。聊聊你的想法，让我们从一次交流开始。
            </p>
            <a
              href="mailto:zbzzzzzzz@qq.com"
              className="group mt-6 inline-flex min-h-12 items-center justify-between gap-10 border border-white/30 bg-white/5 px-5 py-3 text-sm tracking-[.1em] transition-colors hover:border-white/65 hover:bg-white/10 md:mt-7"
            >
              发起合作{' '}
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
              >
                ↗
              </span>
            </a>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
