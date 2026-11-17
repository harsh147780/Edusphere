import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/admin/Dashboard';
import People from './pages/admin/People';
import Courses from './pages/admin/Courses';
import Enrollments from './pages/admin/Enrollments';
import CourseDetails from './pages/shared/CourseDetails';
import FacultyDashboard from './pages/faculty/Dashboard';
import StudentDashboard from './pages/student/Dashboard';
import Submissions from './pages/faculty/Submissions';
import Grades from './pages/shared/Grades';
import StudentAssignments from './pages/student/Assignments';
import FacultyAssignments from './pages/faculty/Assignments';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Spinner from './components/ui/Spinner';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

const Gate = ({ roles, children }) => (
  <ProtectedRoute roles={roles}>
    {children}
  </ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route
        element={
          <Gate>
            <DashboardLayout />
          </Gate>
        }
      >
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />

        <Route path="/admin" element={<Gate roles={['admin']}><AdminDashboard /></Gate>} />
        <Route path="/admin/students" element={<Gate roles={['admin']}><People role="student" /></Gate>} />
        <Route path="/admin/faculty" element={<Gate roles={['admin']}><People role="faculty" /></Gate>} />
        <Route path="/admin/courses" element={<Gate roles={['admin']}><Courses /></Gate>} />
        <Route path="/admin/courses/:id" element={<Gate roles={['admin']}><CourseDetails /></Gate>} />
        <Route path="/admin/enrollments" element={<Gate roles={['admin']}><Enrollments /></Gate>} />
        <Route path="/admin/assignments/:id" element={<Gate roles={['admin']}><Submissions /></Gate>} />
        <Route path="/admin/grades" element={<Gate roles={['admin']}><Grades /></Gate>} />

        <Route path="/faculty" element={<Gate roles={['faculty']}><FacultyDashboard /></Gate>} />
        <Route path="/faculty/courses" element={<Gate roles={['faculty']}><Courses /></Gate>} />
        <Route path="/faculty/courses/:id" element={<Gate roles={['faculty']}><CourseDetails /></Gate>} />
        <Route path="/faculty/assignments" element={<Gate roles={['faculty']}><FacultyAssignments /></Gate>} />
        <Route path="/faculty/assignments/:id" element={<Gate roles={['faculty']}><Submissions /></Gate>} />
        <Route path="/faculty/grades" element={<Gate roles={['faculty']}><Grades /></Gate>} />

        <Route path="/student" element={<Gate roles={['student']}><StudentDashboard /></Gate>} />
        <Route path="/student/courses" element={<Gate roles={['student']}><Courses /></Gate>} />
        <Route path="/student/courses/:id" element={<Gate roles={['student']}><CourseDetails /></Gate>} />
        <Route path="/student/assignments" element={<Gate roles={['student']}><StudentAssignments /></Gate>} />
        <Route path="/student/grades" element={<Gate roles={['student']}><Grades /></Gate>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
