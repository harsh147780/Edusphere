import { useEffect, useState } from 'react';
import api from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import Empty from '../../components/ui/Empty';
import PageHeader from '../../components/ui/PageHeader';
import ProgressBar from '../../components/ui/ProgressBar';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function Grades() {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [course, setCourse] = useState('');
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get('/courses', { params: { limit: 100 } }).then((r) => setCourses(r.data.items));
  }, []);

  useEffect(() => {
    api
      .get('/grades', { params: { course: course || undefined } })
      .then((r) => setItems(r.data.items))
      .catch((e) => toast.error(e.message));
  }, [course]);

  if (!items) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Results"
        title={user.role === 'student' ? 'My grades' : 'Grades & results'}
        subtitle="Published marks, letter grades and faculty feedback."
        actions={
          <select className="input max-w-xs" value={course} onChange={(e) => setCourse(e.target.value)}>
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
        }
      />
      {items.length === 0 ? (
        <Empty title="No published grades" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Assignment</th>
                {user.role !== 'student' && <th>Student</th>}
                <th>Marks</th>
                <th>Grade</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {items.map((g) => (
                <tr key={g._id}>
                  <td>{g.course?.code}</td>
                  <td>{g.assignment?.title}</td>
                  {user.role !== 'student' && <td>{g.student?.name}</td>}
                  <td className="min-w-[140px]">
                    <p className="mb-1 text-sm">
                      {g.marks}/{g.assignment?.maxMarks}
                    </p>
                    <ProgressBar value={g.marks} max={g.assignment?.maxMarks || 100} />
                  </td>
                  <td>
                    <Badge tone="graded">{g.letterGrade}</Badge>
                  </td>
                  <td className="max-w-xs text-slate-500">{g.feedback || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
