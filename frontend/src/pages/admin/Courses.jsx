import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Plus, Users } from 'lucide-react';
import api from '../../api/client';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import Empty from '../../components/ui/Empty';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import useDebounce from '../../hooks/useDebounce';

const blank = {
  title: '',
  code: '',
  description: '',
  credits: 3,
  department: '',
  semester: 'Fall',
  academicYear: '2026',
  faculty: ''
};

export default function Courses() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [faculty, setFaculty] = useState([]);
  const [q, setQ] = useState('');
  const search = useDebounce(q);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [pendingDelete, setPendingDelete] = useState(null);
  const prefix = `/${user.role}`;

  const load = async () => {
    const { data: res } = await api.get('/courses', { params: { search, page, limit: 9 } });
    setData(res);
  };

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [search, page]);

  useEffect(() => {
    if (user.role !== 'admin') return;
    api.get('/users', { params: { role: 'faculty', limit: 100 } }).then((r) => setFaculty(r.data.items));
  }, [user.role]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, faculty: form.faculty || null };
      if (editing) await api.put(`/courses/${editing._id}`, payload);
      else await api.post('/courses', payload);
      toast.success('Course saved');
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/courses/${pendingDelete}`);
      toast.success('Course deleted');
      setPendingDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!data) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Catalog"
        title={user.role === 'admin' ? 'Courses' : 'My courses'}
        subtitle="Browse allocations, faculty and enrollment load."
        actions={
          user.role === 'admin' ? (
            <button
              className="btn-primary"
              onClick={() => {
                setEditing(null);
                setForm(blank);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> New course
            </button>
          ) : null
        }
      />
      <SearchInput value={q} onChange={setQ} placeholder="Search title, code or department" />
      {data.items.length === 0 ? (
        <Empty title="No courses yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((c) => (
            <div key={c._id} className="card group flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">{c.code}</p>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight">{c.title}</h3>
                </div>
                <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">{c.credits} cr</span>
              </div>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-500">{c.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>{c.faculty?.name || 'Unassigned'}</span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Users className="h-3.5 w-3.5" /> {c.enrolledCount}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {c.department} · {c.semester} {c.academicYear}
              </p>
              <div className="mt-4 flex gap-2">
                <Link className="btn-primary flex-1" to={`${prefix}/courses/${c._id}`}>
                  Open <ArrowUpRight className="h-4 w-4" />
                </Link>
                {user.role === 'admin' && (
                  <>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setEditing(c);
                        setForm({
                          title: c.title,
                          code: c.code,
                          description: c.description,
                          credits: c.credits,
                          department: c.department,
                          semester: c.semester,
                          academicYear: c.academicYear,
                          faculty: c.faculty?._id || ''
                        });
                        setOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => setPendingDelete(c._id)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={data.page} pages={data.pages} onPage={setPage} />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit course' : 'Create course'} wide>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Code</label>
            <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </div>
          <div>
            <label className="label">Credits</label>
            <input className="input" type="number" min="1" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
          </div>
          <div>
            <label className="label">Department</label>
            <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
          </div>
          <div>
            <label className="label">Semester</label>
            <input className="input" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
          </div>
          <div>
            <label className="label">Academic year</label>
            <input className="input" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
          </div>
          <div>
            <label className="label">Assign faculty</label>
            <select className="input" value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })}>
              <option value="">Unassigned</option>
              {faculty.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea className="input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn-primary md:col-span-2">Save course</button>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete course"
        message="This removes enrollments, materials and assignments for the course."
        confirmLabel="Delete course"
        danger
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}
