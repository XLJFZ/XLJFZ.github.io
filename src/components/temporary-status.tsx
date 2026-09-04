'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type StatusMessage = {
  text: string;
  tone: 'default' | 'error';
};

export function useTemporaryStatus() {
  const [message, setMessage] = useState<StatusMessage | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showStatus = useCallback(
    (text: string, tone: StatusMessage['tone'] = 'default', timeout = 2200) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage({ text, tone });
      timer.current = setTimeout(() => setMessage(null), timeout);
    },
    [],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { message, showStatus };
}

export function TemporaryStatus({
  message,
}: {
  message: StatusMessage | null;
}) {
  if (!message) return null;

  return (
    <output
      aria-live="polite"
      className={cn(
        'pointer-events-none fixed left-1/2 top-1/2 z-[100] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 border bg-[#242321]/95 px-6 py-4 text-center text-sm leading-relaxed tracking-[0.08em] text-white shadow-[0_12px_38px_rgba(0,0,0,.32)] backdrop-blur-md sm:px-7 sm:py-4.5 sm:text-base',
        message.tone === 'error' ? 'border-red-300/35' : 'border-white/15',
      )}
    >
      {message.text}
    </output>
  );
}
