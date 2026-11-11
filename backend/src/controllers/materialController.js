import { CourseMaterial } from '../models/CourseMaterial.js';
import { Enrollment } from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { persistFile, removeStoredFile } from '../middleware/upload.js';
import { notifyMany, logActivity } from '../utils/notify.js';
import { assertCourseAccess } from '../utils/access.js';
import { httpError } from '../utils/httpError.js';
import { sendStoredFile } from '../utils/sendStoredFile.js';

export const listMaterials = asyncHandler(async (req, res) => {
  await assertCourseAccess(req.user, req.params.courseId);
  const items = await CourseMaterial.find({ course: req.params.courseId })
    .populate('uploadedBy', 'name role')
    .sort({ createdAt: -1 });
  res.json({ success: true, items });
});

export const downloadMaterial = asyncHandler(async (req, res) => {
  const material = await CourseMaterial.findById(req.params.id);
  if (!material) throw httpError(404, 'Material not found');
  await assertCourseAccess(req.user, material.course);
  sendStoredFile(res, material.fileUrl, material.fileName);
});

export const createMaterial = asyncHandler(async (req, res) => {
  const course = await assertCourseAccess(req.user, req.params.courseId);
  if (req.user.role === 'student') {
    const err = new Error('Students cannot upload materials');
    err.statusCode = 403;
    throw err;
  }
  if (!req.file) {
    const err = new Error('A file is required');
    err.statusCode = 400;
    throw err;
  }
  const stored = await persistFile(req.file, 'edusphere/materials');
  const material = await CourseMaterial.create({
    course: course._id,
    uploadedBy: req.user._id,
    title: req.body.title || stored.fileName,
    description: req.body.description || '',
    fileUrl: stored.url,
    fileName: stored.fileName,
    fileType: stored.fileType,
    fileSize: stored.fileSize,
    publicId: stored.publicId
  });
  const students = await Enrollment.find({ course: course._id, status: 'active' }).select('student');
  await notifyMany(
    students.map((e) => e.student),
    {
      title: 'New study material',
      message: `${req.user.name} uploaded “${material.title}” in ${course.code}.`,
      type: 'material',
      link: `/${req.user.role === 'admin' ? 'admin' : 'student'}/courses/${course._id}`
    }
  );
  await logActivity({
    user: req.user._id,
    action: `Uploaded material ${material.title}`,
    entityType: 'CourseMaterial',
    entityId: material._id
  });
  res.status(201).json({ success: true, material });
});

export const updateMaterial = asyncHandler(async (req, res) => {
  const material = await CourseMaterial.findById(req.params.id);
  if (!material) {
    const err = new Error('Material not found');
    err.statusCode = 404;
    throw err;
  }
  await assertCourseAccess(req.user, material.course);
  if (req.user.role === 'student') {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  material.title = req.body.title ?? material.title;
  material.description = req.body.description ?? material.description;
  if (req.file) {
    await removeStoredFile(material.fileUrl, material.publicId);
    const stored = await persistFile(req.file, 'edusphere/materials');
    material.fileUrl = stored.url;
    material.fileName = stored.fileName;
    material.fileType = stored.fileType;
    material.fileSize = stored.fileSize;
    material.publicId = stored.publicId;
  }
  await material.save();
  res.json({ success: true, material });
});

export const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await CourseMaterial.findById(req.params.id);
  if (!material) {
    const err = new Error('Material not found');
    err.statusCode = 404;
    throw err;
  }
  await assertCourseAccess(req.user, material.course);
  if (req.user.role === 'student') {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  await removeStoredFile(material.fileUrl, material.publicId);
  await material.deleteOne();
  res.json({ success: true, message: 'Material deleted' });
});
