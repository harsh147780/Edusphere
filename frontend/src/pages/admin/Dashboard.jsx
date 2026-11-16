import { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, UserCog, Users } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../api/client';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import { formatDateTime } from '../../lib/format';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api
      .get('/dashboard/admin')
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  if (!data && !error) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const dept = (data.charts.byDept || []).map((d) => ({ name: d._id, courses: d.courses }));
  const trend = (data.charts.enrollTrend || []).map((d) => ({ name: d._id.slice(5), count: d.count }));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Institution overview" subtitle="Live counts, allocations and recent campus activity." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={GraduationCap} label="Students" value={data.stats.students} />
        <StatCard icon={UserCog} label="Faculty" value={data.stats.faculty} accent="sky" />
        <StatCard icon={BookOpen} label="Courses" value={data.stats.courses} accent="emerald" />
        <StatCard icon={Users} label="Active enrollments" value={data.stats.enrollments} accent="amber" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Courses by department</h3>
            <span className="text-xs text-slate-400">Current catalog</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dept}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="courses" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="mb-4 font-semibold">User mix</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.charts.roleMix} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                  {data.charts.roleMix.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <h3 className="mb-4 font-semibold">Enrollment trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="enroll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" fill="url(#enroll)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card lg:col-span-2">
          <h3 className="mb-4 font-semibold">Recent activity</h3>
          <ul className="space-y-3">
            {(data.activities || []).slice(0, 7).map((a) => (
              <li key={a._id} className="flex items-center gap-3">
                <Avatar name={a.user?.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{a.action}</p>
                  <p className="text-xs text-slate-400">{a.user?.name} · {formatDateTime(a.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
