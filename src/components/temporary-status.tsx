'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type StatusMessage = {
  text: string;
  tone: 'default' | 'error';
  fallbackValue?: string;
  leaving: boolean;
};

export function useTemporaryStatus() {
  const [message, setMessage] = useState<StatusMessage | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissStatus = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (exitTimer.current) clearTimeout(exitTimer.current);
    setMessage((current) => (current ? { ...current, leaving: true } : null));
    exitTimer.current = setTimeout(() => setMessage(null), 160);
  }, []);

  const showStatus = useCallback(
    (
      text: string,
      tone: StatusMessage['tone'] = 'default',
      timeout = 2200,
      fallbackValue?: string,
    ) => {
      if (timer.current) clearTimeout(timer.current);
      if (exitTimer.current) clearTimeout(exitTimer.current);
      setMessage({ text, tone, fallbackValue, leaving: false });
      if (timeout > 0) timer.current = setTimeout(dismissStatus, timeout);
    },
    [dismissStatus],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (exitTimer.current) clearTimeout(exitTimer.current);
    },
    [],
  );

  return { message, showStatus, dismissStatus };
}

export function TemporaryStatus({
  message,
  onDismiss,
}: {
  message: StatusMessage | null;
  onDismiss: () => void;
}) {
  if (!message) return null;

  return (
    <div
      role={message.tone === 'error' ? 'alert' : 'status'}
      aria-live={message.tone === 'error' ? 'assertive' : 'polite'}
      data-lightbox-interactive
      data-leaving={message.leaving}
      className={cn(
        'temporary-status fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-[100] max-w-[calc(100%-2rem)] border bg-[#242321]/95 px-4 py-3 text-sm leading-relaxed text-white shadow-[0_12px_38px_rgba(0,0,0,.32)] backdrop-blur-md sm:right-6 sm:bottom-6 sm:px-5',
        message.tone === 'error'
          ? 'border-red-300/35'
          : 'pointer-events-none border-white/15',
      )}
    >
      <div className="flex items-start gap-3">
        <span>{message.text}</span>
        {message.fallbackValue && (
          <button
            type="button"
            onClick={onDismiss}
            className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center text-xl text-white/65 hover:text-white"
            aria-label="关闭提示"
          >
            ×
          </button>
        )}
      </div>
      {message.fallbackValue && (
        <input
          readOnly
          value={message.fallbackValue}
          aria-label="可手动复制的内容"
          onFocus={(event) => event.currentTarget.select()}
          onClick={(event) => event.currentTarget.select()}
          className="mt-2 w-full min-w-0 border border-white/20 bg-black/30 px-3 py-2 font-mono text-xs text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        />
      )}
    </div>
  );
}
