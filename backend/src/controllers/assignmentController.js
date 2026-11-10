import { Assignment } from '../models/Assignment.js';
import { Submission } from '../models/Submission.js';
import { Grade } from '../models/Grade.js';
import { Enrollment } from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { persistFile, removeStoredFile } from '../middleware/upload.js';
import { notifyMany, logActivity, notify } from '../utils/notify.js';
import { assertCourseAccess } from '../utils/access.js';
import { toLetterGrade } from '../utils/letterGrade.js';
import { httpError } from '../utils/httpError.js';
import { sendStoredFile } from '../utils/sendStoredFile.js';
import { Course } from '../models/Course.js';

export const listAssignments = asyncHandler(async (req, res) => {
  await assertCourseAccess(req.user, req.params.courseId);
  const items = await Assignment.find({ course: req.params.courseId }).sort({ dueDate: 1 });
  if (req.user.role === 'student') {
    const subs = await Submission.find({
      assignment: { $in: items.map((a) => a._id) },
      student: req.user._id
    });
    const grades = await Grade.find({
      assignment: { $in: items.map((a) => a._id) },
      student: req.user._id,
      published: true
    });
    const subMap = Object.fromEntries(subs.map((s) => [s.assignment.toString(), s]));
    const gradeMap = Object.fromEntries(grades.map((g) => [g.assignment.toString(), g]));
    return res.json({
      success: true,
      items: items.map((a) => ({
        ...a.toObject(),
        submission: subMap[a._id.toString()] || null,
        grade: gradeMap[a._id.toString()] || null
      }))
    });
  }
  const counts = await Submission.aggregate([
    { $match: { assignment: { $in: items.map((a) => a._id) } } },
    { $group: { _id: '$assignment', count: { $sum: 1 } } }
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
  res.json({
    success: true,
    items: items.map((a) => ({ ...a.toObject(), submissionCount: countMap[a._id.toString()] || 0 }))
  });
});

export const listMyAssignments = asyncHandler(async (req, res) => {
  let courseFilter = {};
  if (req.user.role === 'student') {
    const enrollments = await Enrollment.find({ student: req.user._id, status: 'active' }).select('course');
    courseFilter = { course: { $in: enrollments.map((e) => e.course) } };
  } else if (req.user.role === 'faculty') {
    const courses = await Course.find({ faculty: req.user._id }).select('_id');
    courseFilter = { course: { $in: courses.map((c) => c._id) } };
  }

  const items = await Assignment.find(courseFilter).populate('course', 'title code').sort({ dueDate: 1 });

  if (req.user.role === 'student') {
    const ids = items.map((a) => a._id);
    const [subs, grades] = await Promise.all([
      Submission.find({ assignment: { $in: ids }, student: req.user._id }),
      Grade.find({ assignment: { $in: ids }, student: req.user._id, published: true })
    ]);
    const subMap = Object.fromEntries(subs.map((s) => [s.assignment.toString(), s]));
    const gradeMap = Object.fromEntries(grades.map((g) => [g.assignment.toString(), g]));
    return res.json({
      success: true,
      items: items.map((a) => ({
        ...a.toObject(),
        submission: subMap[a._id.toString()] || null,
        grade: gradeMap[a._id.toString()] || null
      }))
    });
  }

  const counts = await Submission.aggregate([
    { $match: { assignment: { $in: items.map((a) => a._id) } } },
    { $group: { _id: '$assignment', count: { $sum: 1 } } }
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
  res.json({
    success: true,
    items: items.map((a) => ({ ...a.toObject(), submissionCount: countMap[a._id.toString()] || 0 }))
  });
});

export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate('course', 'title code faculty');
  if (!assignment) throw httpError(404, 'Assignment not found');
  await assertCourseAccess(req.user, assignment.course._id || assignment.course);
  res.json({ success: true, assignment });
});

export const downloadAssignmentFile = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw httpError(404, 'Assignment not found');
  await assertCourseAccess(req.user, assignment.course);
  sendStoredFile(res, assignment.attachmentUrl, assignment.attachmentName);
});

export const downloadSubmissionFile = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) throw httpError(404, 'Submission not found');
  await assertCourseAccess(req.user, submission.course);
  if (req.user.role === 'student' && submission.student.toString() !== req.user._id.toString()) {
    throw httpError(403, 'You can only download your own submissions');
  }
  sendStoredFile(res, submission.fileUrl, submission.fileName);
});

export const createAssignment = asyncHandler(async (req, res) => {
  const course = await assertCourseAccess(req.user, req.params.courseId);
  if (req.user.role === 'student') {
    throw httpError(403, 'Forbidden');
  }
  if (!req.body.title || !req.body.dueDate) {
    throw httpError(400, 'Title and due date are required');
  }
  let attachment = { url: '', name: '', publicId: '' };
  if (req.file) {
    const stored = await persistFile(req.file, 'edusphere/assignments');
    attachment = { url: stored.url, name: stored.fileName, publicId: stored.publicId };
  }
  const assignment = await Assignment.create({
    course: course._id,
    createdBy: req.user._id,
    title: req.body.title,
    description: req.body.description,
    dueDate: req.body.dueDate,
    maxMarks: Number(req.body.maxMarks) || 100,
    attachmentUrl: attachment.url,
    attachmentName: attachment.name,
    publicId: attachment.publicId
  });
  const students = await Enrollment.find({ course: course._id, status: 'active' }).select('student');
  await notifyMany(
    students.map((e) => e.student),
    {
      title: 'New assignment',
      message: `${assignment.title} is due on ${new Date(assignment.dueDate).toLocaleDateString()}.`,
      type: 'assignment',
      link: `/student/courses/${course._id}`
    }
  );
  await logActivity({
    user: req.user._id,
    action: `Created assignment ${assignment.title}`,
    entityType: 'Assignment',
    entityId: assignment._id
  });
  res.status(201).json({ success: true, assignment });
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    const err = new Error('Assignment not found');
    err.statusCode = 404;
    throw err;
  }
  await assertCourseAccess(req.user, assignment.course);
  if (req.user.role === 'student') {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  ['title', 'description', 'dueDate', 'maxMarks', 'isPublished'].forEach((k) => {
    if (req.body[k] !== undefined) assignment[k] = req.body[k];
  });
  if (req.file) {
    await removeStoredFile(assignment.attachmentUrl, assignment.publicId);
    const stored = await persistFile(req.file, 'edusphere/assignments');
    assignment.attachmentUrl = stored.url;
    assignment.attachmentName = stored.fileName;
    assignment.publicId = stored.publicId;
  }
  await assignment.save();
  res.json({ success: true, assignment });
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    const err = new Error('Assignment not found');
    err.statusCode = 404;
    throw err;
  }
  await assertCourseAccess(req.user, assignment.course);
  if (req.user.role === 'student') {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  await Submission.deleteMany({ assignment: assignment._id });
  await Grade.deleteMany({ assignment: assignment._id });
  await removeStoredFile(assignment.attachmentUrl, assignment.publicId);
  await assignment.deleteOne();
  res.json({ success: true, message: 'Assignment deleted' });
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    const err = new Error('Assignment not found');
    err.statusCode = 404;
    throw err;
  }
  await assertCourseAccess(req.user, assignment.course);
  if (req.user.role !== 'student') {
    const err = new Error('Only students can submit assignments');
    err.statusCode = 403;
    throw err;
  }
  if (!req.file) {
    const err = new Error('A submission file is required');
    err.statusCode = 400;
    throw err;
  }
  const stored = await persistFile(req.file, 'edusphere/submissions');
  const late = new Date() > new Date(assignment.dueDate);
  const existing = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
  if (existing) {
    const graded = await Grade.findOne({ submission: existing._id, published: true });
    if (graded) {
      const err = new Error('This assignment has already been graded');
      err.statusCode = 400;
      throw err;
    }
    await removeStoredFile(existing.fileUrl, existing.publicId);
    existing.fileUrl = stored.url;
    existing.fileName = stored.fileName;
    existing.publicId = stored.publicId;
    existing.submittedAt = new Date();
    existing.status = late ? 'late' : 'submitted';
    await existing.save();
    return res.json({ success: true, submission: existing });
  }
  const submission = await Submission.create({
    assignment: assignment._id,
    student: req.user._id,
    course: assignment.course,
    fileUrl: stored.url,
    fileName: stored.fileName,
    publicId: stored.publicId,
    status: late ? 'late' : 'submitted'
  });
  res.status(201).json({ success: true, submission });
});

export const listSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    const err = new Error('Assignment not found');
    err.statusCode = 404;
    throw err;
  }
  await assertCourseAccess(req.user, assignment.course);
  if (req.user.role === 'student') {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  const items = await Submission.find({ assignment: assignment._id })
    .populate('student', 'name email studentId')
    .sort({ submittedAt: -1 });
  const grades = await Grade.find({ assignment: assignment._id });
  const gradeMap = Object.fromEntries(grades.map((g) => [g.submission.toString(), g]));
  res.json({
    success: true,
    assignment,
    items: items.map((s) => ({ ...s.toObject(), grade: gradeMap[s._id.toString()] || null }))
  });
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate('assignment');
  if (!submission) {
    const err = new Error('Submission not found');
    err.statusCode = 404;
    throw err;
  }
  await assertCourseAccess(req.user, submission.course);
  if (req.user.role === 'student') {
    const err = new Error('Students cannot modify grades');
    err.statusCode = 403;
    throw err;
  }
  const marks = Number(req.body.marks);
  const max = submission.assignment.maxMarks;
  if (Number.isNaN(marks) || marks < 0 || marks > max) {
    const err = new Error(`Marks must be between 0 and ${max}`);
    err.statusCode = 400;
    throw err;
  }
  const published = Boolean(req.body.published);
  const grade = await Grade.findOneAndUpdate(
    { submission: submission._id },
    {
      submission: submission._id,
      assignment: submission.assignment._id,
      student: submission.student,
      course: submission.course,
      faculty: req.user._id,
      marks,
      letterGrade: toLetterGrade(marks, max),
      feedback: req.body.feedback || '',
      published,
      publishedAt: published ? new Date() : null
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  submission.status = 'graded';
  await submission.save();
  if (published) {
    await notify({
      user: submission.student,
      title: 'Grade published',
      message: `Your submission for “${submission.assignment.title}” has been graded.`,
      type: 'grade',
      link: `/student/grades`
    });
  }
  res.json({ success: true, grade });
});
