const base = process.env.API_URL || 'http://127.0.0.1:5000';
const jar = { token: '' };
const results = [];

const api = async (path, opts = {}) => {
  const headers = { ...(opts.headers || {}) };
  if (jar.token) headers.Cookie = `token=${jar.token}`;
  if (opts.body && !headers['Content-Type'] && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(base + path, { ...opts, headers });
  for (const c of res.headers.getSetCookie?.() || []) {
    const m = String(c).match(/token=([^;]*)/);
    if (m) jar.token = m[1];
  }
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
};

const login = (email, password, role) => {
  jar.token = '';
  return api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password, role }) });
};

const check = (name, ok, extra = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` ${extra}` : ''}`);
};

const run = async () => {
  const health = await api('/api/health');
  check('health', health.status === 200 && health.json.ok);

  let r = await login('admin@edusphere.com', 'Admin@123', 'admin');
  check('admin login', r.status === 200);
  check('admin dashboard', (await api('/api/dashboard/admin')).status === 200);
  check('admin activity', (await api('/api/activity')).status === 200);
  check('meta lookups', (await api('/api/meta')).json.departments?.length >= 0);
  const courses = await api('/api/courses');
  check('list courses', courses.status === 200 && courses.json.items.length > 0);
  const courseId = courses.json.items[0]._id;
  check('enrollment search', (await api('/api/enrollments?search=Noah')).status === 200);
  check('admin blocked from faculty dash', (await api('/api/dashboard/faculty')).status === 403);

  r = await login('maya.chen@edusphere.com', 'Faculty@123', 'faculty');
  check('faculty login', r.status === 200);
  check('faculty dashboard', (await api('/api/dashboard/faculty')).status === 200);
  check('faculty cannot list users', (await api('/api/users')).status === 403);
  const mine = await api('/api/assignments/mine');
  check('faculty assignments', mine.status === 200);
  if (mine.json.items[0]) {
    check('faculty submissions', (await api(`/api/assignments/${mine.json.items[0]._id}/submissions`)).status === 200);
  }

  r = await login('noah.patel@edusphere.com', 'Student@123', 'student');
  check('student login', r.status === 200);
  check('student dashboard', (await api('/api/dashboard/student')).status === 200);
  check('student assignments', (await api('/api/assignments/mine')).status === 200);
  check('student submissions', (await api('/api/submissions/mine')).status === 200);
  check('student cannot create course', (await api('/api/courses', {
    method: 'POST',
    body: JSON.stringify({ title: 'Hack', code: 'H1', department: 'X', semester: 'Fall', academicYear: '2026' })
  })).status === 403);
  check('student grades', (await api('/api/grades')).status === 200);
  check('notifications', (await api('/api/notifications')).status === 200);
  check('uploads require auth', (await fetch(`${base}/uploads/sample-architecture.txt`)).status === 401);

  const forgot = await api('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: 'noah.patel@edusphere.com' })
  });
  check('forgot password', forgot.status === 200 && Boolean(forgot.json.resetToken));
  const reset = await api('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: forgot.json.resetToken, newPassword: 'Student@123' })
  });
  check('reset password', reset.status === 200);
  check('login after reset', (await login('noah.patel@edusphere.com', 'Student@123', 'student')).status === 200);

  check('bad password', (await login('admin@edusphere.com', 'wrong', 'admin')).status === 401);
  check('wrong role', (await login('admin@edusphere.com', 'Admin@123', 'student')).status === 403);

  console.log(results.join('\n'));
  const failed = results.filter((x) => x.startsWith('FAIL'));
  if (failed.length) {
    console.error(`FAILED ${failed.length}`);
    process.exit(1);
  }
  console.log(`ALL_PASSED ${results.length}`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
