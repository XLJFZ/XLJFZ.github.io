/** Process one file at a time, yielding between files so cancel and progress can paint. */
export async function runPhotoBatch<T>(
  items: T[],
  process: (item: T) => Promise<void>,
  signal: AbortSignal,
  onProgress: (progress: { done: number; total: number }) => void,
) {
  const failures: Array<{ item: T; message: string }> = [];
  let done = 0;
  for (const item of items) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (signal.aborted) break;
    try {
      await process(item);
    } catch (reason) {
      failures.push({
        item,
        message:
          reason instanceof Error ? reason.message : '无法处理此照片，请重试。',
      });
    }
    if (signal.aborted) break;
    done++;
    onProgress({ done, total: items.length });
  }
  return { failures, pending: items.slice(done) };
}
