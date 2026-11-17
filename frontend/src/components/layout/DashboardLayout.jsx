import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Award,
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserCog,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import Avatar from '../ui/Avatar';
import { greeting, firstName } from '../../lib/format';

const nav = {
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/students', label: 'Students', icon: GraduationCap },
    { to: '/admin/faculty', label: 'Faculty', icon: UserCog },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/enrollments', label: 'Enrollments', icon: Users },
    { to: '/admin/grades', label: 'Results', icon: Award }
  ],
  faculty: [
    { to: '/faculty', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/faculty/courses', label: 'My courses', icon: BookOpen },
    { to: '/faculty/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/faculty/grades', label: 'Results', icon: Award }
  ],
  student: [
    { to: '/student', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/student/courses', label: 'My courses', icon: BookOpen },
    { to: '/student/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/student/grades', label: 'Grades', icon: Award }
  ]
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [unread, setUnread] = useState(0);
  const items = useMemo(() => nav[user?.role] || [], [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/notifications');
        setUnread(data.unread || 0);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, []);

  const signOut = async () => {
    await logout();
    navigate('/login');
  };

  const Sidebar = () => (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#0b1220] text-indigo-100">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
      <div className="relative flex items-center gap-3 px-5 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-lg shadow-indigo-950/40">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold tracking-tight text-white">EduSphere</p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-indigo-300">{user?.role} workspace</p>
        </div>
      </div>
      <nav className="sidebar-scroll relative flex-1 space-y-1 overflow-y-auto px-3 pb-6">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-white/10 text-white shadow-inner' : 'text-indigo-200 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="relative border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-2">
          <Avatar name={user?.name} src={user?.avatar} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-[11px] text-indigo-300">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6fb] lg:flex">
      <aside className="hidden w-[272px] shrink-0 lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="relative h-full w-[272px]">
            <Sidebar />
            <button className="absolute right-3 top-4 text-white" onClick={() => setOpen(false)}>
              <X />
            </button>
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button className="rounded-xl p-2 hover:bg-slate-50 lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs text-slate-500">{greeting()}</p>
              <p className="font-semibold tracking-tight text-slate-900">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/notifications" className="relative rounded-xl p-2 hover:bg-slate-50">
              <Bell className="h-5 w-5 text-slate-600" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <div className="relative">
              <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 hover:bg-slate-50" onClick={() => setMenu((v) => !v)}>
                <Avatar name={user?.name} src={user?.avatar} size="sm" />
                <span className="hidden text-sm font-medium sm:block">{firstName(user?.name)}</span>
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-1 shadow-card">
                  <Link to="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-slate-50" onClick={() => setMenu(false)}>
                    <Settings className="h-4 w-4" /> Profile
                  </Link>
                  <button onClick={signOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-7">
          <div className="animate-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
