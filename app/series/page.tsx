import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { series } from '@/lib/portfolio';

export default function SeriesIndex() {
  return (
    <main>
      <SiteHeader />
      <section className="px-5 pb-16 pt-14 md:px-10 md:pb-24 md:pt-24">
        <div className="mb-14 grid gap-6 md:grid-cols-2 md:items-end">
          <h1 className="text-[clamp(2.8rem,6.5vw,5.8rem)] font-medium leading-none tracking-[-0.055em]">作品系列</h1>
          <p className="max-w-md text-sm font-light leading-7 text-black/55 md:justify-self-end">从城市边缘到高原腹地，观察光线、时间与自然之间的关系。</p>
        </div>
        <div className="space-y-16 md:space-y-24">
          {series.map((item, index) => (
            <Link href={`/series/${item.slug}`} key={item.slug} className={`group block ${index % 2 ? 'md:ml-[17%]' : 'md:mr-[17%]'}`}>
              <div className="overflow-hidden bg-neutral-200"><img src={item.cover} alt={item.title} className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]" /></div>
              <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto] md:items-start">
                <div><p className="text-[10px] uppercase tracking-[0.22em] text-black/45">{item.category} · {item.year}</p><h2 className="mt-2 text-3xl font-medium tracking-[-0.04em] md:text-5xl">{item.title}</h2></div>
                <p className="text-xs tracking-[0.12em] text-black/50 md:mt-1">{item.englishTitle} ↗</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
