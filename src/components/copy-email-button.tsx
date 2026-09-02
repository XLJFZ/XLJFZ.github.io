'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  TemporaryStatus,
  useTemporaryStatus,
} from '@/components/temporary-status';
import { cn } from '@/lib/utils';

const EMAIL = 'zbzzzzzzz@qq.com';

export function CopyEmailButton({
  children = 'Email',
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { message, showStatus } = useTemporaryStatus();

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      showStatus(`邮箱已复制 · ${EMAIL}`);
    } catch {
      showStatus(`复制失败，请手动复制：${EMAIL}`, 'error', 4000);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="link"
        onClick={copyEmail}
        className={cn(
          'h-auto p-0 text-inherit underline-offset-4 hover:no-underline',
          className,
        )}
        aria-label={`复制邮箱 ${EMAIL}`}
      >
        {children}
      </Button>
      <TemporaryStatus message={message} />
    </>
  );
}
