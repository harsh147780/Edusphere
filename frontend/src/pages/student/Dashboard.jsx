import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, ClipboardList, Clock } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../api/client';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
import Empty from '../../components/ui/Empty';
import ErrorState from '../../components/ui/ErrorState';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { dueMeta, formatDateTime } from '../../lib/format';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api
      .get('/dashboard/student')
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
      <PageHeader eyebrow="Academics" title="Your semester" subtitle="Enrolled courses, upcoming work and published performance." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Courses" value={data.stats.courses} />
        <StatCard icon={ClipboardList} label="Assignments" value={data.stats.assignments} accent="sky" />
        <StatCard icon={Clock} label="Pending" value={data.stats.pending} accent="amber" />
        <StatCard icon={Award} label="Average marks" value={data.stats.avg} accent="emerald" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="mb-4 font-semibold">Performance</h3>
          <div className="h-64">
            {(data.performance || []).length === 0 ? (
              <Empty title="Grades appear after faculty publishes results" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="marks" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="card">
          <h3 className="mb-4 font-semibold">Upcoming deadlines</h3>
          {(data.upcoming || []).length === 0 ? (
            <Empty title="No upcoming work" />
          ) : (
            <ul className="space-y-3">
              {(data.upcoming || []).map((a) => {
                const due = dueMeta(a.dueDate);
                return (
                  <li key={a._id} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{a.title}</p>
                      <Badge tone={due.tone}>{due.label}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(a.dueDate)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(data.enrollments || []).map((e) => (
          <Link key={e._id} to={`/student/courses/${e.course?._id}`} className="card hover:border-indigo-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">{e.course?.code}</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{e.course?.title}</p>
            <p className="text-sm text-slate-500">Faculty: {e.course?.faculty?.name || 'TBA'}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
