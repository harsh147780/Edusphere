import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import Empty from '../../components/ui/Empty';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import ProgressBar from '../../components/ui/ProgressBar';
import { useToast } from '../../context/ToastContext';
import { dueMeta, formatDateTime } from '../../lib/format';

export default function StudentAssignments() {
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
      <PageHeader eyebrow="Academics" title="Assignments" subtitle="Deadlines, submission status and published scores." />
      {rows.length === 0 ? (
        <Empty title="No assignments" />
      ) : (
        <div className="space-y-3">
          {rows.map((a) => {
            const due = dueMeta(a.dueDate);
            return (
              <div key={a._id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">{a.course?.code}</p>
                    <p className="mt-1 font-semibold">{a.title}</p>
                    <p className="text-sm text-slate-500">Due {formatDateTime(a.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={due.tone}>{due.label}</Badge>
                    {a.submission ? <Badge tone={a.submission.status}>{a.submission.status}</Badge> : <Badge>Open</Badge>}
                  </div>
                </div>
                {a.grade && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Score</span>
                      <span>
                        {a.grade.marks}/{a.maxMarks} · {a.grade.letterGrade}
                      </span>
                    </div>
                    <ProgressBar value={a.grade.marks} max={a.maxMarks} />
                  </div>
                )}
                <div className="mt-4">
                  <Link className="btn-primary" to={`/student/courses/${a.course?._id}`}>
                    Open course
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
