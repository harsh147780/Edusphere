import { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/ui/Avatar';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', department: user.department || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      setUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/password', pw);
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Your account details and security." />
      <div className="card flex items-center gap-4">
        <Avatar name={user.name} src={user.avatar} size="lg" />
        <div>
          <p className="text-lg font-semibold">{user.name}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
          <div className="mt-2">
            <Badge tone={user.role}>{user.role}</Badge>
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <form className="card space-y-3" onSubmit={saveProfile}>
          <h2 className="text-lg font-semibold">Details</h2>
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-slate-50" value={user.email} disabled />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Department</label>
            <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <button className="btn-primary" disabled={busy}>
            Save profile
          </button>
        </form>
        <form className="card space-y-3" onSubmit={savePassword}>
          <h2 className="text-lg font-semibold">Password</h2>
          <div>
            <label className="label">Current password</label>
            <input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">New password</label>
            <input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          </div>
          <button className="btn-primary">Update password</button>
        </form>
      </div>
    </div>
  );
}
