'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const EMAIL = 'zbzzzzzzz@qq.com';

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(EMAIL);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = EMAIL;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  toast.add({
    id: 'email-copied',
    title: '复制成功',
    description: EMAIL,
    type: 'success',
    timeout: 2200,
  });
}

export function CopyEmailButton({ children = 'Email', className }: { children?: ReactNode; className?: string }) {
  return (
    <Button
      type="button"
      variant="link"
      onClick={copyEmail}
      className={cn('h-auto p-0 text-inherit underline-offset-4 hover:no-underline', className)}
      aria-label={`复制邮箱 ${EMAIL}`}
    >
      {children}
    </Button>
  );
}
