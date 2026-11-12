import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, FileText, Plus, Users } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/ui/Spinner';
import Empty from '../../components/ui/Empty';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ProgressBar from '../../components/ui/ProgressBar';
import { dueMeta, formatDateTime } from '../../lib/format';

export default function CourseDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user.role === 'admin' || user.role === 'faculty';
  const tabs = canManage
    ? ['Overview', 'Students', 'Materials', 'Assignments', 'Performance']
    : ['Overview', 'Materials', 'Assignments', 'Performance'];
  const [tab, setTab] = useState('Overview');
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [matOpen, setMatOpen] = useState(false);
  const [asgOpen, setAsgOpen] = useState(false);
  const [matForm, setMatForm] = useState({ title: '', description: '', file: null });
  const [asgForm, setAsgForm] = useState({ title: '', description: '', dueDate: '', maxMarks: 100, file: null });
  const [submitFor, setSubmitFor] = useState(null);
  const [subFile, setSubFile] = useState(null);
  const [pending, setPending] = useState(null);
  const prefix = `/${user.role}`;

  const load = async () => {
    const [c, m, a, s, g] = await Promise.all([
      api.get(`/courses/${id}`),
      api.get(`/courses/${id}/materials`),
      api.get(`/courses/${id}/assignments`),
      api.get(`/courses/${id}/students`),
      api.get(`/courses/${id}/performance`)
    ]);
    setCourse(c.data.course);
    setMaterials(m.data.items);
    setAssignments(a.data.items);
    setStudents(s.data.items);
    setGrades(g.data.items);
  };

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [id]);

  const uploadMaterial = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', matForm.title);
    fd.append('description', matForm.description);
    fd.append('file', matForm.file);
    try {
      await api.post(`/courses/${id}/materials`, fd);
      toast.success('Material uploaded');
      setMatOpen(false);
      setMatForm({ title: '', description: '', file: null });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const createAssignment = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(asgForm).forEach(([k, v]) => {
      if (k === 'file' && v) fd.append('file', v);
      else if (k !== 'file') fd.append(k, v);
    });
    try {
      await api.post(`/courses/${id}/assignments`, fd);
      toast.success('Assignment created');
      setAsgOpen(false);
      setAsgForm({ title: '', description: '', dueDate: '', maxMarks: 100, file: null });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitWork = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('file', subFile);
    try {
      await api.post(`/assignments/${submitFor._id}/submit`, fd);
      toast.success('Assignment submitted');
      setSubmitFor(null);
      setSubFile(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const runPending = async () => {
    try {
      if (pending.type === 'material') await api.delete(`/materials/${pending.id}`);
      if (pending.type === 'assignment') await api.delete(`/assignments/${pending.id}`);
      toast.success('Deleted');
      setPending(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!course) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-[#0b1220] p-6 text-white shadow-card md:p-8">
        <div className="absolute inset-0 bg-mesh opacity-80" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">{course.code}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{course.title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-indigo-100">{course.description}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-indigo-100">
            <span className="inline-flex items-center gap-2">
              <Avatar name={course.faculty?.name} size="sm" src={course.faculty?.avatar} />
              {course.faculty?.name || 'No faculty'}
            </span>
            <span>{course.department}</span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> {course.enrolledCount} enrolled
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card">
            <h3 className="font-semibold">Faculty</h3>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={course.faculty?.name} src={course.faculty?.avatar} />
              <div>
                <p className="font-medium">{course.faculty?.name || 'Unassigned'}</p>
                <p className="text-sm text-slate-500">{course.faculty?.email}</p>
                <p className="text-sm text-slate-500">{course.faculty?.department}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold">Details</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-400">Credits</dt>
                <dd className="font-medium">{course.credits}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Semester</dt>
                <dd className="font-medium">
                  {course.semester} {course.academicYear}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {tab === 'Students' && (
        <div className="table-wrap">
          {students.length === 0 ? (
            <div className="p-6">
              <Empty title="No students enrolled" />
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th className="hidden md:table-cell">Email</th>
                </tr>
              </thead>
              <tbody>
                {students.map((e) => (
                  <tr key={e._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={e.student?.name} size="sm" />
                        {e.student?.name}
                      </div>
                    </td>
                    <td>{e.student?.studentId}</td>
                    <td className="hidden md:table-cell">{e.student?.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'Materials' && (
        <div className="space-y-4">
          {canManage && (
            <button className="btn-primary" onClick={() => setMatOpen(true)}>
              <Plus className="h-4 w-4" /> Upload material
            </button>
          )}
          {materials.length === 0 ? (
            <Empty title="No study materials" />
          ) : (
            <div className="space-y-3">
              {materials.map((m) => (
                <div key={m._id} className="card flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{m.title}</p>
                      <p className="text-sm text-slate-500">{m.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a className="btn-secondary" href={`/api/materials/${m._id}/file`}>
                      <Download className="h-4 w-4" /> Download
                    </a>
                    {canManage && (
                      <button className="btn-ghost text-rose-600" onClick={() => setPending({ type: 'material', id: m._id })}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Assignments' && (
        <div className="space-y-4">
          {canManage && (
            <button className="btn-primary" onClick={() => setAsgOpen(true)}>
              <Plus className="h-4 w-4" /> Create assignment
            </button>
          )}
          {assignments.length === 0 ? (
            <Empty title="No assignments" />
          ) : (
            assignments.map((a) => {
              const due = dueMeta(a.dueDate);
              return (
                <div key={a._id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="text-sm text-slate-500">{a.description}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        Due {formatDateTime(a.dueDate)} · Max {a.maxMarks}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={due.tone}>{due.label}</Badge>
                      {user.role === 'student' && (a.submission ? <Badge tone={a.submission.status}>{a.submission.status}</Badge> : <Badge>Not submitted</Badge>)}
                    </div>
                  </div>
                  {a.grade && (
                    <div className="mt-3">
                      <ProgressBar value={a.grade.marks} max={a.maxMarks} />
                      <p className="mt-1 text-sm font-semibold text-indigo-700">
                        {a.grade.marks}/{a.maxMarks} ({a.grade.letterGrade})
                      </p>
                      {a.grade.feedback && <p className="text-sm text-slate-500">{a.grade.feedback}</p>}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.attachmentUrl && (
                      <a className="btn-secondary" href={`/api/assignments/${a._id}/file`}>
                        Brief
                      </a>
                    )}
                    {user.role === 'student' && (
                      <button className="btn-primary" onClick={() => setSubmitFor(a)}>
                        {a.submission ? 'Resubmit' : 'Submit'}
                      </button>
                    )}
                    {canManage && (
                      <>
                        <Link className="btn-primary" to={`${prefix}/assignments/${a._id}`}>
                          Submissions {a.submissionCount != null ? `(${a.submissionCount})` : ''}
                        </Link>
                        <button className="btn-danger" onClick={() => setPending({ type: 'assignment', id: a._id })}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'Performance' && (
        <div className="table-wrap">
          {grades.length === 0 ? (
            <div className="p-6">
              <Empty title="No published results yet" />
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  {user.role !== 'student' && <th>Student</th>}
                  <th>Assignment</th>
                  <th>Marks</th>
                  <th>Grade</th>
                  <th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g._id}>
                    {user.role !== 'student' && <td>{g.student?.name}</td>}
                    <td>{g.assignment?.title}</td>
                    <td>
                      {g.marks}/{g.assignment?.maxMarks}
                    </td>
                    <td className="font-semibold text-indigo-700">{g.letterGrade}</td>
                    <td>{g.feedback || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={matOpen} onClose={() => setMatOpen(false)} title="Upload material">
        <form onSubmit={uploadMaterial} className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="e.g. Lecture 4 notes" value={matForm.title} onChange={(e) => setMatForm({ ...matForm, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} placeholder="Short summary of the material" value={matForm.description} onChange={(e) => setMatForm({ ...matForm, description: e.target.value })} />
          </div>
          <div>
            <label className="label">File</label>
            <input className="input" type="file" onChange={(e) => setMatForm({ ...matForm, file: e.target.files[0] })} required />
          </div>
          <button className="btn-primary w-full">Upload</button>
        </form>
      </Modal>

      <Modal open={asgOpen} onClose={() => setAsgOpen(false)} title="New assignment">
        <form onSubmit={createAssignment} className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="e.g. Binary search tree" value={asgForm.title} onChange={(e) => setAsgForm({ ...asgForm, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} placeholder="What students need to do" value={asgForm.description} onChange={(e) => setAsgForm({ ...asgForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Due date</label>
              <input className="input" type="datetime-local" value={asgForm.dueDate} onChange={(e) => setAsgForm({ ...asgForm, dueDate: e.target.value })} required />
            </div>
            <div>
              <label className="label">Max marks</label>
              <input className="input" type="number" min="1" value={asgForm.maxMarks} onChange={(e) => setAsgForm({ ...asgForm, maxMarks: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Brief file (optional)</label>
            <input className="input" type="file" onChange={(e) => setAsgForm({ ...asgForm, file: e.target.files[0] })} />
          </div>
          <button className="btn-primary w-full">Create</button>
        </form>
      </Modal>

      <Modal open={Boolean(submitFor)} onClose={() => setSubmitFor(null)} title={`Submit ${submitFor?.title || ''}`}>
        <form onSubmit={submitWork} className="space-y-3">
          <div>
            <label className="label">Your work</label>
            <input className="input" type="file" onChange={(e) => setSubFile(e.target.files[0])} required />
          </div>
          <button className="btn-primary w-full">Submit work</button>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete item"
        message="This cannot be undone."
        confirmLabel="Delete"
        danger
        onClose={() => setPending(null)}
        onConfirm={runPending}
      />
    </div>
  );
}
