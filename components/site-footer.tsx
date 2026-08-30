import { CopyEmailButton } from '@/components/copy-email-button';

export function SiteFooter() {
  return (
    <footer className="grid gap-8 border-t border-black/10 px-5 py-9 text-[11px] tracking-[.08em] md:grid-cols-[1fr_auto] md:px-10">
      <p>© 2026 迅雷疾风</p>
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-black/55">
        <a className="transition-colors hover:text-black" href="https://www.xiaohongshu.com/user/profile/61b4585d000000001000ea69" target="_blank" rel="noreferrer">小红书</a>
        <CopyEmailButton className="text-[11px] tracking-[.08em] transition-colors hover:text-black">Email</CopyEmailButton>
      </div>
    </footer>
  );
}
