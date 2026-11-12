const styles = {
  admin: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  faculty: 'bg-sky-50 text-sky-700 ring-sky-100',
  student: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  submitted: 'bg-sky-50 text-sky-700 ring-sky-100',
  late: 'bg-amber-50 text-amber-800 ring-amber-100',
  graded: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  pending: 'bg-slate-100 text-slate-600 ring-slate-200',
  info: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-800 ring-amber-100',
  assignment: 'bg-violet-50 text-violet-700 ring-violet-100',
  grade: 'bg-sky-50 text-sky-700 ring-sky-100',
  material: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  enrollment: 'bg-emerald-50 text-emerald-700 ring-emerald-100'
};

export default function Badge({ children, tone = 'pending' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ${styles[tone] || styles.pending}`}>
      {children}
    </span>
  );
}
