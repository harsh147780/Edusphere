import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/ui/Spinner';
import { firstName } from '../lib/format';

const roles = [
  { id: 'admin', label: 'Admin' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'student', label: 'Student' }
];

const presets = {
  admin: { email: 'admin@edusphere.com', password: 'Admin@123' },
  faculty: { email: 'maya.chen@edusphere.com', password: 'Faculty@123' },
  student: { email: 'noah.patel@edusphere.com', password: 'Student@123' }
};

export default function Login() {
  const { user, loading, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState('admin');
  const [form, setForm] = useState(presets.admin);
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;
  if (user) return <Navigate to={`/${user.role}`} replace />;

  const onRole = (id) => {
    setRole(id);
    setForm(presets[id]);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login({ ...form, role });
      toast.success(`Welcome back, ${firstName(u.name)}`);
      navigate(`/${u.role}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#0b1220] lg:flex lg:flex-col lg:justify-between p-12 text-white">
        <div className="absolute inset-0 bg-mesh" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500">
            <GraduationCap />
          </div>
          <span className="text-xl font-semibold tracking-tight">EduSphere</span>
        </div>
        <div className="relative max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">Campus operating system</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[1.1] tracking-tight">A calmer way to run teaching and learning.</h1>
          <p className="mt-5 text-indigo-200">
            One workspace for administrators, faculty and students — courses, materials, assignments and published results.
          </p>
          <div className="mt-10 grid gap-4">
            {[
              { icon: ShieldCheck, text: 'Role-based access with secure sessions' },
              { icon: Users, text: 'Live enrollments, grading and feedback' },
              { icon: Sparkles, text: 'Analytics that stay out of the way' }
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-indigo-100">
                <item.icon className="h-4 w-4 text-sky-300" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-indigo-300">Demo credentials are prefilled for each portal.</p>
      </div>
      <div className="flex items-center justify-center bg-[#f4f6fb] p-6">
        <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-semibold">EduSphere</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a portal and continue to your workspace.</p>
          <div className="mt-6 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
            {roles.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => onRole(r.id)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${role === r.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <label className="label mt-6">Email or ID</label>
          <input className="input" type="text" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@university.edu or your ID" required />
          <div className="mt-4 flex items-center justify-between">
            <label className="label mb-0">Password</label>
            <Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button className="btn-primary mt-6 w-full py-3" disabled={busy}>
            {busy ? 'Signing in...' : 'Enter workspace'}
          </button>
          <p className="mt-4 text-center text-sm text-slate-500">
            Only an administrator can create student and faculty accounts.{' '}
            <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:underline">
              Recover access
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
