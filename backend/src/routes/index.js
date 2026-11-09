import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as auth from '../controllers/authController.js';
import * as users from '../controllers/userController.js';
import * as courses from '../controllers/courseController.js';
import * as enrollments from '../controllers/enrollmentController.js';
import * as materials from '../controllers/materialController.js';
import * as assignments from '../controllers/assignmentController.js';
import * as dashboard from '../controllers/dashboardController.js';
import * as grades from '../controllers/gradeController.js';
import * as notifications from '../controllers/notificationController.js';

const router = Router();

router.post('/auth/login', auth.login);
router.post('/auth/forgot-password', auth.forgotPassword);
router.post('/auth/reset-password', auth.resetPassword);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', protect, auth.me);
router.put('/auth/profile', protect, upload.single('avatar'), auth.updateProfile);
router.put('/auth/password', protect, auth.changePassword);

router.get('/dashboard/admin', protect, authorize('admin'), dashboard.adminDashboard);
router.get('/dashboard/faculty', protect, authorize('faculty'), dashboard.facultyDashboard);
router.get('/dashboard/student', protect, authorize('student'), dashboard.studentDashboard);

router.get('/users', protect, authorize('admin'), users.listUsers);
router.get('/users/:id', protect, authorize('admin'), users.getUser);
router.post('/users', protect, authorize('admin'), users.createUser);
router.put('/users/:id', protect, authorize('admin'), users.updateUser);
router.delete('/users/:id', protect, authorize('admin'), users.deleteUser);

router.get('/courses', protect, courses.listCourses);
router.get('/courses/:id', protect, courses.getCourse);
router.post('/courses', protect, authorize('admin'), courses.createCourse);
router.put('/courses/:id', protect, authorize('admin'), courses.updateCourse);
router.delete('/courses/:id', protect, authorize('admin'), courses.deleteCourse);
router.post('/courses/:id/assign-faculty', protect, authorize('admin'), courses.assignFaculty);
router.get('/courses/:id/students', protect, courses.courseStudents);
router.get('/courses/:id/performance', protect, grades.coursePerformance);

router.get('/enrollments', protect, authorize('admin'), enrollments.listEnrollments);
router.post('/enrollments', protect, authorize('admin'), enrollments.enrollStudent);
router.delete('/enrollments/:id', protect, authorize('admin'), enrollments.unenroll);

router.get('/courses/:courseId/materials', protect, materials.listMaterials);
router.post('/courses/:courseId/materials', protect, authorize('admin', 'faculty'), upload.single('file'), materials.createMaterial);
router.get('/materials/:id/file', protect, materials.downloadMaterial);
router.put('/materials/:id', protect, authorize('admin', 'faculty'), upload.single('file'), materials.updateMaterial);
router.delete('/materials/:id', protect, authorize('admin', 'faculty'), materials.deleteMaterial);

router.get('/assignments/mine', protect, assignments.listMyAssignments);
router.get('/courses/:courseId/assignments', protect, assignments.listAssignments);
router.post('/courses/:courseId/assignments', protect, authorize('admin', 'faculty'), upload.single('file'), assignments.createAssignment);
router.get('/assignments/:id', protect, assignments.getAssignment);
router.get('/assignments/:id/file', protect, assignments.downloadAssignmentFile);
router.put('/assignments/:id', protect, authorize('admin', 'faculty'), upload.single('file'), assignments.updateAssignment);
router.delete('/assignments/:id', protect, authorize('admin', 'faculty'), assignments.deleteAssignment);
router.post('/assignments/:id/submit', protect, authorize('student'), upload.single('file'), assignments.submitAssignment);
router.get('/assignments/:id/submissions', protect, authorize('admin', 'faculty'), assignments.listSubmissions);
router.get('/submissions/:id/file', protect, assignments.downloadSubmissionFile);
router.put('/submissions/:id/grade', protect, authorize('admin', 'faculty'), assignments.gradeSubmission);

router.get('/grades', protect, grades.myGrades);

router.get('/notifications', protect, notifications.listNotifications);
router.put('/notifications/read-all', protect, notifications.markAllRead);
router.put('/notifications/:id/read', protect, notifications.markRead);

export default router;
