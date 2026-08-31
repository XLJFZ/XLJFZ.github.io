'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const EMAIL = 'zbzzzzzzz@qq.com';

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(EMAIL);
    toast.add({
      id: 'email-copied',
      title: '复制成功',
      description: EMAIL,
      type: 'success',
      timeout: 2200,
    });
  } catch {
    toast.add({
      id: 'email-copy-failed',
      title: '复制失败',
      description: `请手动复制：${EMAIL}`,
      type: 'error',
      timeout: 4000,
    });
  }
}

export function CopyEmailButton({
  children = 'Email',
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
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
  );
}
