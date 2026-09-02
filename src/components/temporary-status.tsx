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
        'pointer-events-none fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[100] -translate-x-1/2 border bg-[#242321]/95 px-4 py-2.5 text-center text-xs tracking-[0.08em] text-white shadow-[0_12px_38px_rgba(0,0,0,.32)] backdrop-blur-md',
        message.tone === 'error' ? 'border-red-300/35' : 'border-white/15',
      )}
    >
      {message.text}
    </output>
  );
}
