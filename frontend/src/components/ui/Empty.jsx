import { Inbox } from 'lucide-react';

export default function Empty({ title = 'Nothing here yet', subtitle, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center">
      <div className="mb-3 rounded-2xl bg-white p-3 text-slate-400 shadow-sm">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="font-medium text-slate-800">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-slate-500">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
