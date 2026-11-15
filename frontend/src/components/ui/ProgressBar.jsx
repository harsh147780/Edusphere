export default function ProgressBar({ value = 0, max = 100 }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
