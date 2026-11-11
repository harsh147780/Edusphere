import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import api from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import Empty from '../../components/ui/Empty';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../lib/format';

export default function Submissions() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({ marks: '', feedback: '', published: true });

  const load = () => api.get(`/assignments/${id}/submissions`).then((r) => setData(r.data));

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [id]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/submissions/${active._id}/grade`, form);
      toast.success(form.published ? 'Marks published' : 'Evaluation saved');
      setActive(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!data) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Evaluation"
        title={data.assignment.title}
        subtitle={`Due ${formatDateTime(data.assignment.dueDate)} · Maximum ${data.assignment.maxMarks} marks`}
      />
      {data.items.length === 0 ? (
        <Empty title="No submissions yet" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Marks</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={s.student?.name} size="sm" />
                      <div>
                        <p className="font-medium">{s.student?.name}</p>
                        <p className="text-xs text-slate-400">{s.student?.studentId}</p>
                      </div>
                    </div>
                  </td>
                  <td>{formatDateTime(s.submittedAt)}</td>
                  <td>
                    <Badge tone={s.status}>{s.status}</Badge>
                  </td>
                  <td>{s.grade ? `${s.grade.marks} (${s.grade.letterGrade})` : '—'}</td>
                  <td className="text-right">
                    <a className="btn-ghost" href={`/api/submissions/${s._id}/file`}>
                      <Download className="h-4 w-4" /> File
                    </a>
                    <button
                      className="btn-primary ml-2"
                      onClick={() => {
                        setActive(s);
                        setForm({
                          marks: s.grade?.marks ?? '',
                          feedback: s.grade?.feedback ?? '',
                          published: s.grade?.published ?? true
                        });
                      }}
                    >
                      Evaluate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(active)} onClose={() => setActive(null)} title={`Evaluate ${active?.student?.name || ''}`}>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Marks (max {data.assignment.maxMarks})</label>
            <input
              className="input"
              type="number"
              min="0"
              max={data.assignment.maxMarks}
              value={form.marks}
              onChange={(e) => setForm({ ...form, marks: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Feedback</label>
            <textarea className="input min-h-24" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Publish marks to student
          </label>
          <button className="btn-primary w-full">Save evaluation</button>
        </form>
      </Modal>
    </div>
  );
}
