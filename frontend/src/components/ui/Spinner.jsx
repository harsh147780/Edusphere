export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-indigo-600">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
