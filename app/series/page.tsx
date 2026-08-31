import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { series } from '@/lib/portfolio';

export default function SeriesIndex() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-[1600px] px-5 pb-20 pt-14 md:px-10 md:pb-28 md:pt-24">
        <div className="mb-14 grid gap-6 md:grid-cols-2 md:items-end">
          <h1 className="text-[clamp(2.8rem,6.5vw,5.8rem)] font-medium leading-none tracking-[-0.055em]">作品系列</h1>
          <p className="max-w-md text-sm font-light leading-7 text-black/55 md:justify-self-end">从城市街巷到高原腹地，在建筑、地景与日常之间观察光线和时间。</p>
        </div>
        <div className="space-y-16 md:space-y-24">
          {series.map((item, index) => (
            <a href={`/series/${item.slug}/`} key={item.slug} className={`group block ${index % 2 ? 'md:ml-[17%]' : 'md:mr-[17%]'}`}>
              <div className="relative overflow-hidden bg-neutral-200 shadow-[0_24px_80px_rgba(38,34,27,.08)]"><img src={item.cover} alt={item.title} className="aspect-[16/10] w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.025]" style={{ objectPosition: item.coverPosition ?? 'center' }} /><div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden="true" /><span className="absolute left-4 top-4 border border-white/30 bg-black/15 px-2.5 py-1 text-[9px] tracking-[.2em] text-white backdrop-blur-sm md:left-5 md:top-5">{String(index + 1).padStart(2, '0')}</span></div>
              <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto] md:items-start">
                <div><p className="text-[10px] uppercase tracking-[0.22em] text-black/45">{item.category} · {item.year}</p><h2 className="mt-2 text-3xl font-medium tracking-[-0.04em] md:text-5xl">{item.title}</h2><p className="mt-3 text-[10px] tracking-[.14em] text-black/35">{item.location}</p></div>
                <p className="text-xs tracking-[0.12em] text-black/50 transition-transform duration-300 group-hover:translate-x-1 md:mt-1">{item.englishTitle} ↗</p>
              </div>
            </a>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
