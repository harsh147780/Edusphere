import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Assignment } from '../models/Assignment.js';
import { Submission } from '../models/Submission.js';
import { Grade } from '../models/Grade.js';
import { Activity } from '../models/Activity.js';
import { CourseMaterial } from '../models/CourseMaterial.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const adminDashboard = asyncHandler(async (req, res) => {
  const [students, faculty, courses, enrollments, activities] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'faculty' }),
    Course.countDocuments(),
    Enrollment.countDocuments({ status: 'active' }),
    Activity.find().populate('user', 'name role').sort({ createdAt: -1 }).limit(12)
  ]);

  const byDept = await Course.aggregate([{ $group: { _id: '$department', courses: { $sum: 1 } } }]);
  const enrollTrend = await Enrollment.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 14 }
  ]);
  const roleMix = [
    { name: 'Students', value: students },
    { name: 'Faculty', value: faculty },
    { name: 'Admins', value: await User.countDocuments({ role: 'admin' }) }
  ];

  res.json({
    success: true,
    stats: { students, faculty, courses, enrollments },
    charts: { byDept, enrollTrend, roleMix },
    activities
  });
});

export const facultyDashboard = asyncHandler(async (req, res) => {
  const courses = await Course.find({ faculty: req.user._id });
  const courseIds = courses.map((c) => c._id);
  const [enrolled, assignments, pending, materials] = await Promise.all([
    Enrollment.countDocuments({ course: { $in: courseIds }, status: 'active' }),
    Assignment.countDocuments({ course: { $in: courseIds } }),
    Submission.countDocuments({ course: { $in: courseIds }, status: { $in: ['submitted', 'late'] } }),
    CourseMaterial.countDocuments({ course: { $in: courseIds } })
  ]);
  const perCourse = await Enrollment.aggregate([
    { $match: { course: { $in: courseIds }, status: 'active' } },
    { $group: { _id: '$course', students: { $sum: 1 } } }
  ]);
  const courseMap = Object.fromEntries(courses.map((c) => [c._id.toString(), c.title]));
  const chart = perCourse.map((p) => ({ name: courseMap[p._id.toString()] || 'Course', students: p.students }));
  const recentSubs = await Submission.find({ course: { $in: courseIds } })
    .populate('student', 'name')
    .populate('assignment', 'title')
    .sort({ submittedAt: -1 })
    .limit(8);

  res.json({
    success: true,
    stats: { courses: courses.length, enrolled, assignments, pending, materials },
    courses,
    chart,
    recentSubs
  });
});

export const studentDashboard = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id, status: 'active' }).populate({
    path: 'course',
    populate: { path: 'faculty', select: 'name email' }
  });
  const courseIds = enrollments.map((e) => e.course?._id).filter(Boolean);
  const [assignments, submissions, grades] = await Promise.all([
    Assignment.find({ course: { $in: courseIds } }).sort({ dueDate: 1 }),
    Submission.find({ student: req.user._id }),
    Grade.find({ student: req.user._id, published: true }).populate('assignment', 'title maxMarks').populate('course', 'title code')
  ]);
  const submittedIds = new Set(submissions.map((s) => s.assignment.toString()));
  const upcoming = assignments.filter((a) => new Date(a.dueDate) >= new Date()).slice(0, 6);
  const pending = assignments.filter((a) => !submittedIds.has(a._id.toString()));
  const performance = grades.map((g) => ({
    name: g.assignment?.title || 'Assignment',
    marks: g.marks,
    max: g.assignment?.maxMarks || 100
  }));
  const avg =
    grades.length > 0 ? Math.round(grades.reduce((s, g) => s + g.marks, 0) / grades.length) : 0;

  res.json({
    success: true,
    stats: {
      courses: enrollments.length,
      assignments: assignments.length,
      pending: pending.length,
      avg
    },
    enrollments,
    upcoming,
    grades,
    performance
  });
});
