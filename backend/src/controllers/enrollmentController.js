import { Enrollment } from '../models/Enrollment.js';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notify, logActivity } from '../utils/notify.js';
import { httpError } from '../utils/httpError.js';

export const listEnrollments = asyncHandler(async (req, res) => {
  const { search = '', page = 1, limit = 10, course, student } = req.query;
  const q = {};
  if (course) q.course = course;
  if (student) q.student = student;
  if (search) {
    const rx = { $regex: search, $options: 'i' };
    const [matchedUsers, matchedCourses] = await Promise.all([
      User.find({ $or: [{ name: rx }, { email: rx }, { studentId: rx }] }).select('_id'),
      Course.find({ $or: [{ title: rx }, { code: rx }] }).select('_id')
    ]);
    q.$or = [{ student: { $in: matchedUsers.map((u) => u._id) } }, { course: { $in: matchedCourses.map((c) => c._id) } }];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Enrollment.find(q)
      .populate('student', 'name email studentId department')
      .populate({ path: 'course', populate: { path: 'faculty', select: 'name email' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Enrollment.countDocuments(q)
  ]);
  res.json({ success: true, items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
});

export const enrollStudent = asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.body;
  const student = await User.findById(studentId);
  const course = await Course.findById(courseId);
  if (!student || student.role !== 'student') {
    throw httpError(400, 'Valid student is required');
  }
  if (!course) {
    throw httpError(404, 'Course not found');
  }
  const enrollment = await Enrollment.create({
    student: student._id,
    course: course._id,
    enrolledBy: req.user._id
  });
  await notify({
    user: student._id,
    title: 'Enrolled in a course',
    message: `You have been enrolled in ${course.code} — ${course.title}.`,
    type: 'enrollment',
    link: `/student/courses/${course._id}`
  });
  await logActivity({
    user: req.user._id,
    action: `Enrolled ${student.name} in ${course.code}`,
    entityType: 'Enrollment',
    entityId: enrollment._id
  });
  const populated = await enrollment.populate([
    { path: 'student', select: 'name email studentId' },
    { path: 'course', select: 'title code' }
  ]);
  res.status(201).json({ success: true, enrollment: populated });
});

export const unenroll = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) {
    const err = new Error('Enrollment not found');
    err.statusCode = 404;
    throw err;
  }
  await enrollment.deleteOne();
  res.json({ success: true, message: 'Enrollment removed' });
});
