import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { User } from '../models/User.js';
import { CourseMaterial } from '../models/CourseMaterial.js';
import { Assignment } from '../models/Assignment.js';
import { Submission } from '../models/Submission.js';
import { Grade } from '../models/Grade.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notify, logActivity } from '../utils/notify.js';
import { assertCourseAccess } from '../utils/access.js';
import { httpError } from '../utils/httpError.js';
import { removeStoredFile } from '../middleware/upload.js';

export const listCourses = asyncHandler(async (req, res) => {
  const { search = '', page = 1, limit = 12, department, semester } = req.query;
  const q = {};
  if (department) q.department = department;
  if (semester) q.semester = semester;
  if (search) {
    q.$or = [
      { title: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } }
    ];
  }

  if (req.user.role === 'faculty') q.faculty = req.user._id;
  if (req.user.role === 'student') {
    const enrollments = await Enrollment.find({ student: req.user._id, status: 'active' }).select('course');
    q._id = { $in: enrollments.map((e) => e.course) };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Course.find(q).populate('faculty', 'name email department').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Course.countDocuments(q)
  ]);

  const ids = items.map((c) => c._id);
  const counts = await Enrollment.aggregate([
    { $match: { course: { $in: ids }, status: 'active' } },
    { $group: { _id: '$course', count: { $sum: 1 } } }
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
  const withCounts = items.map((c) => ({ ...c.toObject(), enrolledCount: countMap[c._id.toString()] || 0 }));

  res.json({
    success: true,
    items: withCounts,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1
  });
});

export const getCourse = asyncHandler(async (req, res) => {
  const course = await assertCourseAccess(req.user, req.params.id);
  await course.populate('faculty', 'name email phone department employeeId avatar');
  const enrolledCount = await Enrollment.countDocuments({ course: course._id, status: 'active' });
  res.json({ success: true, course: { ...course.toObject(), enrolledCount } });
});

export const createCourse = asyncHandler(async (req, res) => {
  const { title, code, description, credits, faculty, department, semester, academicYear, isActive } = req.body;
  if (!title || !code || !department || !semester || !academicYear) {
    throw httpError(400, 'Title, code, department, semester and academic year are required');
  }
  let facultyId = faculty || null;
  if (facultyId) {
    const member = await User.findById(facultyId);
    if (!member || member.role !== 'faculty') {
      throw httpError(400, 'Valid faculty member is required');
    }
  }
  const course = await Course.create({
    title,
    code,
    description,
    credits,
    faculty: facultyId,
    department,
    semester,
    academicYear,
    isActive
  });
  if (course.faculty) {
    await notify({
      user: course.faculty,
      title: 'Course assigned',
      message: `You have been assigned to ${course.code} — ${course.title}.`,
      type: 'info',
      link: `/faculty/courses/${course._id}`
    });
  }
  await logActivity({
    user: req.user._id,
    action: `Created course ${course.code}`,
    entityType: 'Course',
    entityId: course._id
  });
  res.status(201).json({ success: true, course });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const allowed = ['title', 'code', 'description', 'credits', 'faculty', 'department', 'semester', 'academicYear', 'thumbnail', 'isActive'];
  const payload = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) payload[k] = req.body[k] === '' ? null : req.body[k];
  });
  if (payload.faculty) {
    const member = await User.findById(payload.faculty);
    if (!member || member.role !== 'faculty') {
      throw httpError(400, 'Valid faculty member is required');
    }
  }
  const course = await Course.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!course) throw httpError(404, 'Course not found');
  res.json({ success: true, course });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw httpError(404, 'Course not found');

  const materials = await CourseMaterial.find({ course: course._id });
  await Promise.all(materials.map((m) => removeStoredFile(m.fileUrl, m.publicId)));
  const assignments = await Assignment.find({ course: course._id });
  await Promise.all(assignments.map((a) => removeStoredFile(a.attachmentUrl, a.publicId)));
  const submissions = await Submission.find({ course: course._id });
  await Promise.all(submissions.map((s) => removeStoredFile(s.fileUrl, s.publicId)));

  await Promise.all([
    CourseMaterial.deleteMany({ course: course._id }),
    Assignment.deleteMany({ course: course._id }),
    Submission.deleteMany({ course: course._id }),
    Grade.deleteMany({ course: course._id }),
    Enrollment.deleteMany({ course: course._id })
  ]);
  await course.deleteOne();
  res.json({ success: true, message: 'Course deleted' });
});

export const assignFaculty = asyncHandler(async (req, res) => {
  const { facultyId } = req.body;
  const faculty = await User.findById(facultyId);
  if (!faculty || faculty.role !== 'faculty') {
    const err = new Error('Valid faculty member is required');
    err.statusCode = 400;
    throw err;
  }
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { faculty: faculty._id },
    { new: true }
  ).populate('faculty', 'name email');
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }
  await notify({
    user: faculty._id,
    title: 'Course assigned',
    message: `You have been assigned to ${course.code} — ${course.title}.`,
    type: 'info',
    link: `/faculty/courses/${course._id}`
  });
  res.json({ success: true, course });
});

export const courseStudents = asyncHandler(async (req, res) => {
  await assertCourseAccess(req.user, req.params.id);
  const enrollments = await Enrollment.find({ course: req.params.id, status: 'active' })
    .populate('student', 'name email studentId department phone avatar')
    .sort({ createdAt: -1 });
  res.json({ success: true, items: enrollments });
});
