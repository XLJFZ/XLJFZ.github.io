import { cn } from '@/lib/utils';

type SiteHeaderProps = {
  active?: 'series' | 'tools' | 'about';
};

export function SiteHeader({ active }: SiteHeaderProps) {
  return (
    <>
      <header className="site-header fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent bg-[#151514]/70 px-5 text-white shadow-[0_8px_30px_rgba(0,0,0,.08),inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-2xl backdrop-saturate-150 md:px-10">
        <a
          href="/"
          className="site-nav-link inline-flex min-h-11 items-center text-[13px] font-semibold tracking-[0.22em] transition-opacity hover:opacity-60"
          aria-label="迅雷疾风首页"
        >
          迅雷疾风
        </a>
        <nav
          aria-label="主导航"
          className="-mr-2.5 flex items-center text-xs tracking-[0.14em] md:gap-3"
        >
          <a
            className={cn(
              'site-nav-link relative inline-flex min-h-11 min-w-11 items-center justify-center px-2.5 after:absolute after:inset-x-2.5 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100',
              active === 'tools' && 'after:scale-x-100',
            )}
            href="/tools/"
            aria-current={active === 'tools' ? 'page' : undefined}
          >
            工具
          </a>
          <a
            className={cn(
              'site-nav-link relative inline-flex min-h-11 min-w-11 items-center justify-center px-2.5 after:absolute after:inset-x-2.5 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100',
              active === 'series' && 'after:scale-x-100',
            )}
            href="/series/"
            aria-current={active === 'series' ? 'page' : undefined}
          >
            作品
          </a>
          <a
            className={cn(
              'site-nav-link relative inline-flex min-h-11 min-w-11 items-center justify-center px-2.5 after:absolute after:inset-x-2.5 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100',
              active === 'about' && 'after:scale-x-100',
            )}
            href="/about/"
            aria-current={active === 'about' ? 'page' : undefined}
          >
            关于
          </a>
        </nav>
      </header>
      <div className="site-header-spacer shrink-0" aria-hidden="true" />
    </>
  );
}
