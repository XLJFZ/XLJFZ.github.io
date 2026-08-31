import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { series } from '@/lib/portfolio';

export default function Home() {
  return (
    <main>
      <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-neutral-950 text-white">
        <SiteHeader inverse />
        <img
          src="/hero-zbz-2714.jpg"
          alt="暮色中的雪山群峰与湖面倒影"
          width="3000"
          height="1717"
          fetchPriority="high"
          decoding="async"
          className="hero-image absolute inset-0 h-full w-full scale-[1.02] object-cover opacity-95"
          style={{ filter: 'saturate(1.14) contrast(1.02)' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,18,.3)_0%,transparent_38%,rgba(8,10,18,.82)_100%)]" aria-hidden="true" />
        <div className="absolute inset-x-5 bottom-[7.5rem] z-10 h-px bg-white/20 md:inset-x-10 md:bottom-[9.25rem]" aria-hidden="true" />
        <div className="relative z-10 grid w-full gap-8 px-5 pb-8 md:grid-cols-[1fr_auto] md:items-end md:px-10 md:pb-11">
          <div className="max-w-3xl">
            <p className="mb-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-white/65"><span className="inline-block h-px w-8 bg-white/45" />风光 · 建筑 · 在路上</p>
            <h1 className="text-[clamp(2.7rem,5.6vw,5.6rem)] font-medium leading-[0.95] tracking-[-0.045em]">风从群山来</h1>
            <p className="mt-5 max-w-md text-xs font-light leading-6 text-white/62 md:text-sm">在抵达与离开之间，记录光线、天气和地景短暂相遇的瞬间。</p>
          </div>
          <div className="flex items-end justify-between gap-8 md:flex-col md:items-end">
            <p className="text-[10px] tracking-[0.15em] text-white/50">梅里雪山（雪达湖）· 2025</p>
            <a href="/series/" className="group flex items-center gap-5 border-b border-white/35 pb-2 text-xs tracking-[0.14em] transition-colors hover:border-white hover:text-white">
              浏览作品 <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-32">
        <div className="mb-16 grid gap-7 border-t border-foreground/10 pt-5 md:grid-cols-[1fr_1.2fr] md:items-start">
          <p className="text-[10px] tracking-[0.24em] text-foreground/45">精选系列 · 01—{String(series.length).padStart(2, '0')}</p>
          <p className="max-w-xl text-lg font-light leading-8 tracking-[-0.02em] md:justify-self-end md:text-xl md:leading-9">在城市的秩序与自然的偶然之间，寻找安静、准确而有余韵的画面。</p>
        </div>

        <div className="space-y-20 md:space-y-28">
          {series.map((item, index) => (
            <a href={`/series/${item.slug}/`} key={item.slug} className={`group grid gap-5 md:grid-cols-[1.45fr_.55fr] md:items-end md:gap-10 ${index % 2 ? 'md:grid-cols-[.55fr_1.45fr]' : ''}`}>
              <div className={`relative overflow-hidden bg-[#292824] shadow-[0_22px_70px_rgba(0,0,0,.28)] ${index % 2 ? 'md:order-2' : ''}`}>
                <img src={item.cover} alt={item.title} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.025]" style={{ objectPosition: item.coverPosition ?? 'center' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden="true" />
                <span className="absolute left-4 top-4 border border-white/30 bg-black/15 px-2.5 py-1 text-[9px] tracking-[.2em] text-white backdrop-blur-sm md:left-5 md:top-5">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className={index % 2 ? 'md:order-1' : ''}>
                <div className="flex items-center justify-between border-t border-foreground/10 pt-3 text-[10px] tracking-[.18em] text-foreground/40">
                  <span>{String(index + 1).padStart(2, '0')} · {item.category}</span>
                  <span>{item.year}</span>
                </div>
                <h2 className="mt-5 text-4xl font-medium leading-none tracking-[-.05em] md:text-5xl">{item.title}</h2>
                <p className="mt-3 text-xs tracking-[.1em] text-foreground/45">{item.englishTitle}</p>
                <p className="mt-6 max-w-sm text-sm font-light leading-7 text-foreground/55">{item.statement}</p>
                <p className="mt-4 text-[10px] tracking-[.14em] text-foreground/35">{item.location}</p>
                <span className="mt-7 inline-flex items-center gap-4 text-xs tracking-[.1em]">进入系列 <span className="transition-transform group-hover:translate-x-1">→</span></span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="relative grid gap-12 overflow-hidden bg-[#181817] px-5 py-20 text-white md:grid-cols-2 md:px-10 md:py-28">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/[.035] blur-3xl" aria-hidden="true" />
        <div><p className="mb-5 text-[10px] tracking-[.22em] text-white/38">合作与委托</p><h2 className="text-[clamp(2.4rem,5vw,4.6rem)] font-medium leading-[.98] tracking-[-.05em]">让影像保持呼吸</h2></div>
        <div className="max-w-lg md:self-end md:justify-self-end"><p className="font-light leading-8 text-white/62">可承接建筑、风光、旅行与编辑类拍摄。若你有一个等待被看见的地点，欢迎来信。</p><a href="mailto:zbzzzzzzz@qq.com" className="mt-8 inline-flex border-b border-white/35 pb-2 text-sm tracking-[.1em] transition-colors hover:border-white">发起合作 →</a></div>
      </section>
      <SiteFooter />
    </main>
  );
}
