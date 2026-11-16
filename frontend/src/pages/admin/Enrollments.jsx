import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../../api/client';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import Empty from '../../components/ui/Empty';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Avatar from '../../components/ui/Avatar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';
import { formatDate } from '../../lib/format';

export default function Enrollments() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const search = useDebounce(q);
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ studentId: '', courseId: '' });
  const [pending, setPending] = useState(null);

  const load = () =>
    api.get('/enrollments', { params: { page, limit: 10, search } }).then((r) => setData(r.data));

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [page, search]);

  useEffect(() => {
    Promise.all([
      api.get('/users', { params: { role: 'student', limit: 200 } }),
      api.get('/courses', { params: { limit: 200 } })
    ]).then(([s, c]) => {
      setStudents(s.data.items);
      setCourses(c.data.items);
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/enrollments', form);
      toast.success('Student enrolled');
      setOpen(false);
      setForm({ studentId: '', courseId: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/enrollments/${pending}`);
      toast.success('Enrollment removed');
      setPending(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!data) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Allocations"
        title="Enrollments"
        subtitle="Place students on courses and keep the roster accurate."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Enroll student
          </button>
        }
      />
      <SearchInput value={q} onChange={setQ} placeholder="Search student or course" />
      {data.items.length === 0 ? (
        <Empty title="No enrollments" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th className="hidden md:table-cell">Faculty</th>
                <th>Status</th>
                <th className="hidden sm:table-cell">Enrolled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((e) => (
                <tr key={e._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={e.student?.name} size="sm" />
                      <div>
                        <p className="font-medium">{e.student?.name}</p>
                        <p className="text-xs text-slate-400">{e.student?.studentId}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="font-medium">{e.course?.code}</p>
                    <p className="text-xs text-slate-400">{e.course?.title}</p>
                  </td>
                  <td className="hidden md:table-cell">{e.course?.faculty?.name || '—'}</td>
                  <td>
                    <Badge tone="active">{e.status}</Badge>
                  </td>
                  <td className="hidden sm:table-cell text-slate-500">{formatDate(e.createdAt)}</td>
                  <td className="text-right">
                    <button className="btn-ghost text-rose-600" onClick={() => setPending(e._id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={data.page} pages={data.pages} onPage={setPage} />
      <Modal open={open} onClose={() => setOpen(false)} title="Enroll student">
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Student</label>
            <select className="input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.studentId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Course</label>
            <select className="input" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary w-full">Enroll</button>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(pending)}
        title="Remove enrollment"
        message="The student will lose access to this course."
        confirmLabel="Remove"
        danger
        onClose={() => setPending(null)}
        onConfirm={remove}
      />
    </div>
  );
}
