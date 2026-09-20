import { CopyEmailButton } from '@/components/copy-email-button';

export function SiteFooter() {
  return (
    <footer className="border-t border-foreground/15">
      <div className="mx-auto grid w-full max-w-[1600px] gap-7 px-5 py-8 text-xs leading-6 tracking-[.06em] md:grid-cols-[1fr_auto] md:items-center md:gap-12 md:px-10 md:py-10">
        <div>
          <p className="text-sm font-medium tracking-[.12em]">迅雷疾风</p>
          <p className="mt-1 text-foreground/65">
            © {new Date().getFullYear()} · 建筑与风光摄影
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-foreground/70 md:gap-x-10">
          <nav
            aria-label="页脚导航"
            className="flex flex-wrap items-center gap-x-6 gap-y-1"
          >
            <a
              className="inline-flex min-h-11 items-center transition-colors hover:text-foreground"
              href="/series/"
            >
              作品
            </a>
            <a
              className="inline-flex min-h-11 items-center transition-colors hover:text-foreground"
              href="/about/"
            >
              关于
            </a>
          </nav>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <a
              className="inline-flex min-h-11 items-center transition-colors hover:text-foreground"
              href="https://www.xiaohongshu.com/user/profile/61b4585d000000001000ea69"
              target="_blank"
              rel="noreferrer"
            >
              小红书{' '}
              <span aria-hidden="true" className="ml-1">
                ↗
              </span>
            </a>
            <CopyEmailButton className="min-h-11 text-xs font-normal tracking-[.06em] transition-colors hover:text-foreground">
              复制邮箱
            </CopyEmailButton>
          </div>
          <a
            className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-foreground"
            href="#top"
          >
            返回顶部 <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
