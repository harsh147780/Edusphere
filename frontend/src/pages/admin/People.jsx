import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../../api/client';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Empty from '../../components/ui/Empty';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Avatar from '../../components/ui/Avatar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';

const emptyForm = {
  name: '',
  email: '',
  password: 'Password@123',
  phone: '',
  department: '',
  employeeId: '',
  studentId: '',
  isActive: true
};

export default function People({ role }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const search = useDebounce(q);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = async () => {
    const { data: res } = await api.get('/users', { params: { role, search, page, limit: 8 } });
    setData(res);
  };

  useEffect(() => {
    setPage(1);
  }, [role, search]);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [role, page, search]);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const startEdit = (u) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      phone: u.phone || '',
      department: u.department || '',
      employeeId: u.employeeId || '',
      studentId: u.studentId || '',
      isActive: u.isActive
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, role };
      if (!payload.password) delete payload.password;
      if (editing) await api.put(`/users/${editing._id}`, payload);
      else await api.post('/users', payload);
      toast.success(editing ? 'Account updated' : 'Account created');
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/users/${pendingDelete._id}`);
      toast.success('User deleted');
      setPendingDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <Spinner />;

  const plural = role === 'faculty' ? 'faculty' : `${role}s`;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Directory"
        title={role === 'student' ? 'Students' : 'Faculty'}
        subtitle={`Create, update and deactivate ${role} accounts.`}
        actions={
          <button className="btn-primary" onClick={startCreate}>
            <Plus className="h-4 w-4" /> Add {role}
          </button>
        }
      />
      <SearchInput value={q} onChange={setQ} placeholder={`Search ${plural} by name, email or ID`} />
      {data.items.length === 0 ? (
        <Empty title={`No ${plural} found`} subtitle="Try a different search or create a new account." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th className="hidden md:table-cell">Contact</th>
                <th className="hidden sm:table-cell">Department</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} src={u.avatar} />
                      <div>
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.studentId || u.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    {u.email}
                    <p className="text-xs text-slate-400">{u.phone || '—'}</p>
                  </td>
                  <td className="hidden sm:table-cell">{u.department || '—'}</td>
                  <td>
                    <Badge tone={u.isActive ? 'active' : 'pending'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="text-right">
                    <button className="btn-ghost" onClick={() => startEdit(u)}>
                      Edit
                    </button>
                    <button className="btn-ghost text-rose-600" onClick={() => setPendingDelete(u)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={data.page} pages={data.pages} onPage={setPage} />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${role}` : `New ${role}`}>
        <form onSubmit={save} className="grid gap-3">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Password {editing && '(leave blank to keep)'}</label>
            <input className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          {role === 'faculty' && (
            <div>
              <label className="label">Employee ID</label>
              <input className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
            </div>
          )}
          {role === 'student' && (
            <div>
              <label className="label">Student ID</label>
              <input className="input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
            </div>
          )}
          {editing && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active account
            </label>
          )}
          <button className="btn-primary mt-2" disabled={busy}>
            {busy ? 'Saving...' : 'Save'}
          </button>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete account"
        message={`Remove ${pendingDelete?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}
