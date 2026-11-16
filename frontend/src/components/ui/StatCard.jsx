export default function StatCard({ icon: Icon, label, value, hint, accent = 'indigo' }) {
  const map = {
    indigo: 'from-indigo-500 to-indigo-600',
    sky: 'from-sky-500 to-cyan-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500'
  };
  return (
    <div className="card relative overflow-hidden">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-50" />
      <div className="relative flex items-start gap-4">
        <div className={`rounded-2xl bg-gradient-to-br p-3 text-white shadow-sm ${map[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
