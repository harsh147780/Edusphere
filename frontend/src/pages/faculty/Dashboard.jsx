import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, FileText, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../api/client';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
import Empty from '../../components/ui/Empty';
import ErrorState from '../../components/ui/ErrorState';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDateTime } from '../../lib/format';

export default function FacultyDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api
      .get('/dashboard/faculty')
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  if (!data && !error) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teaching" title="Faculty overview" subtitle="Assigned courses, pending reviews and latest student work." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Courses" value={data.stats.courses} />
        <StatCard icon={Users} label="Students" value={data.stats.enrolled} accent="sky" />
        <StatCard icon={ClipboardList} label="Assignments" value={data.stats.assignments} accent="emerald" />
        <StatCard icon={FileText} label="Pending reviews" value={data.stats.pending} accent="amber" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold">Students per course</h3>
          <div className="h-64">
            {(data.chart || []).length === 0 ? (
              <Empty title="No enrollment data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="students" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="card">
          <h3 className="mb-4 font-semibold">Latest submissions</h3>
          {(data.recentSubs || []).length === 0 ? (
            <Empty title="No submissions yet" />
          ) : (
            <ul className="space-y-3">
              {(data.recentSubs || []).map((s) => (
                <li key={s._id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={s.student?.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.student?.name}</p>
                      <p className="truncate text-xs text-slate-500">{s.assignment?.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge tone={s.status}>{s.status}</Badge>
                    <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(s.submittedAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(data.courses || []).map((c) => (
          <Link key={c._id} to={`/faculty/courses/${c._id}`} className="card hover:border-indigo-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">{c.code}</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{c.title}</p>
            <p className="text-sm text-slate-500">{c.department}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
