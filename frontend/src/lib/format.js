// Leading honorifics that should not be treated as a person's name.
const TITLES = new Set(['dr', 'mr', 'mrs', 'ms', 'prof', 'professor', 'sir', 'madam']);

const nameParts = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .filter((p, i) => !(i === 0 && TITLES.has(p.replace(/\.$/, '').toLowerCase())));

export const initials = (name = '') =>
  nameParts(name)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || 'ES';

export const firstName = (name = '') => nameParts(name)[0] || 'there';

export const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export const dueMeta = (dueDate) => {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = due - now;
  const days = Math.ceil(diff / 86400000);
  if (diff < 0) return { label: 'Overdue', tone: 'late' };
  if (days <= 2) return { label: `Due in ${days}d`, tone: 'late' };
  if (days <= 7) return { label: `Due in ${days}d`, tone: 'submitted' };
  return { label: formatDate(dueDate), tone: 'pending' };
};
