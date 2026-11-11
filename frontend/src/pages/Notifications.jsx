import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Spinner from '../components/ui/Spinner';
import Empty from '../components/ui/Empty';
import Badge from '../components/ui/Badge';
import PageHeader from '../components/ui/PageHeader';
import { formatDateTime } from '../lib/format';

export default function Notifications() {
  const [data, setData] = useState(null);

  const load = () => api.get('/notifications').then((r) => setData(r.data));

  useEffect(() => {
    load();
  }, []);

  if (!data) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        subtitle={`${data.unread} unread`}
        actions={
          <button
            className="btn-secondary"
            onClick={async () => {
              await api.put('/notifications/read-all');
              load();
            }}
          >
            Mark all read
          </button>
        }
      />
      {data.items.length === 0 ? (
        <Empty title="You're all caught up" />
      ) : (
        <div className="space-y-2">
          {data.items.map((n) => (
            <button
              key={n._id}
              className={`card w-full text-left ${n.read ? 'opacity-70' : 'border-indigo-200 bg-indigo-50/30'}`}
              onClick={async () => {
                if (!n.read) await api.put(`/notifications/${n._id}/read`);
                load();
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-slate-500">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                </div>
                <Badge tone={n.type}>{n.type}</Badge>
              </div>
              {n.link && (
                <Link className="mt-3 inline-block text-sm font-semibold text-indigo-600" to={n.link}>
                  Open
                </Link>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
