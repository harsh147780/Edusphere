import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import Empty from '../../components/ui/Empty';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import { useToast } from '../../context/ToastContext';
import { dueMeta, formatDateTime } from '../../lib/format';

export default function FacultyAssignments() {
  const toast = useToast();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api
      .get('/assignments/mine')
      .then((r) => setRows(r.data.items))
      .catch((e) => toast.error(e.message));
  }, []);

  if (!rows) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Teaching" title="Assignments" subtitle="Deadlines and submission volume across your courses." />
      {rows.length === 0 ? (
        <Empty title="No assignments yet" subtitle="Create one from a course workspace." />
      ) : (
        <div className="space-y-3">
          {rows.map((a) => {
            const due = dueMeta(a.dueDate);
            return (
              <div key={a._id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">{a.course?.code}</p>
                  <p className="mt-1 font-semibold">{a.title}</p>
                  <p className="text-sm text-slate-500">Due {formatDateTime(a.dueDate)} · Max {a.maxMarks}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={due.tone}>{due.label}</Badge>
                  <Badge>{a.submissionCount || 0} submissions</Badge>
                  <Link className="btn-primary" to={`/faculty/assignments/${a._id}`}>
                    Review
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
