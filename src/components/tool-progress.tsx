export function ToolProgress({
  done,
  total,
  label,
}: {
  done: number;
  total: number;
  label: string;
}) {
  return (
    <div className="space-y-3" aria-live="polite">
      <div className="flex items-center justify-between gap-4 text-xs text-white/65">
        <span>{label}</span>
        <span className="tabular-nums">
          {done} / {total}
        </span>
      </div>
      <progress
        className="tool-progress"
        aria-label={label}
        value={done}
        max={total || 1}
      />
    </div>
  );
}
