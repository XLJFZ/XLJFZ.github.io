import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function NotFound() {
  return (
    <main id="top">
      <SiteHeader />
      <section
        id="content"
        className="flex min-h-[calc(100svh-150px)] items-center px-5 py-16 md:px-10 md:py-24"
      >
        <div className="w-full border-y border-foreground/10 py-12 md:grid md:grid-cols-[auto_1fr_auto] md:items-end md:gap-12 md:py-16">
          <p className="font-mono text-xs tracking-[.2em] text-foreground/40">
            404
          </p>
          <div className="mt-8 md:mt-0">
            <h1 className="text-[clamp(2.7rem,7vw,6.5rem)] font-medium leading-[.92] tracking-[-.055em]">
              这一帧不在这里
            </h1>
            <p className="mt-5 max-w-lg text-sm font-light leading-7 text-foreground/55">
              页面可能已经移动，或链接有误。可以回到作品目录，继续浏览完整专题。
            </p>
          </div>
          <a
            href="/series/"
            className="mt-10 inline-flex border-b border-foreground/25 pb-1 text-xs tracking-[.14em] transition-colors hover:border-foreground md:mt-0"
          >
            返回作品&nbsp;&nbsp;→
          </a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
