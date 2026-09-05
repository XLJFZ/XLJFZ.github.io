import { ArrowUpRight } from 'lucide-react';

export function PrivacyNextStep() {
  return (
    <a
      href="/tools/exif-privacy/"
      className="mt-4 flex items-center justify-between gap-4 border border-white/10 px-4 py-3 text-left text-xs leading-5 text-white/52 transition-colors hover:border-white/25 hover:text-white"
    >
      <span>
        <span className="block text-white/78">下一步：检查照片隐私</span>
        <span className="mt-0.5 block">
          发布前检查位置、设备标识等敏感 EXIF
        </span>
      </span>
      <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
    </a>
  );
}
