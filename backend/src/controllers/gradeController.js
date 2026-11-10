import { Grade } from '../models/Grade.js';
import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const myGrades = asyncHandler(async (req, res) => {
  const q = { published: true };
  if (req.user.role === 'student') q.student = req.user._id;
  if (req.user.role === 'faculty') {
    const courses = await Course.find({ faculty: req.user._id }).select('_id');
    q.course = { $in: courses.map((c) => c._id) };
  }
  if (req.query.course) q.course = req.query.course;
  const items = await Grade.find(q)
    .populate('student', 'name studentId email')
    .populate('assignment', 'title maxMarks dueDate')
    .populate('course', 'title code')
    .populate('faculty', 'name')
    .sort({ publishedAt: -1 });
  res.json({ success: true, items });
});

export const coursePerformance = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    const enrolled = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.id,
      status: 'active'
    });
    if (!enrolled) {
      const err = new Error('You can only access enrolled courses');
      err.statusCode = 403;
      throw err;
    }
  } else if (req.user.role === 'faculty') {
    const course = await Course.findById(req.params.id);
    if (!course || course.faculty?.toString() !== req.user._id.toString()) {
      const err = new Error('You can only manage assigned courses');
      err.statusCode = 403;
      throw err;
    }
  }
  const q = { course: req.params.id };
  if (req.user.role === 'student') {
    q.student = req.user._id;
    q.published = true;
  }
  const items = await Grade.find(q)
    .populate('student', 'name studentId')
    .populate('assignment', 'title maxMarks');
  res.json({ success: true, items });
});
