import { User } from '../models/User.js';
import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { Submission } from '../models/Submission.js';
import { Grade } from '../models/Grade.js';
import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notify, logActivity } from '../utils/notify.js';
import { httpError } from '../utils/httpError.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { role, search = '', page = 1, limit = 10, active } = req.query;
  const q = {};
  if (role) q.role = role;
  if (active === 'true') q.isActive = true;
  if (active === 'false') q.isActive = false;
  if (search) {
    q.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    User.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(q)
  ]);
  res.json({
    success: true,
    items,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  res.json({ success: true, user });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, department, employeeId, studentId } = req.body;
  if (!name || !email) {
    throw httpError(400, 'Name and email are required');
  }
  if (!['faculty', 'student', 'admin'].includes(role)) {
    throw httpError(400, 'Invalid role');
  }
  const user = await User.create({
    name,
    email,
    password: password || 'Password@123',
    role,
    phone,
    department,
    employeeId: role === 'faculty' ? employeeId || `FAC-${Date.now().toString().slice(-6)}` : undefined,
    studentId: role === 'student' ? studentId || `STU-${Date.now().toString().slice(-6)}` : undefined
  });
  await notify({
    user: user._id,
    title: 'Welcome to EduSphere',
    message: `Your ${role} account has been created.`,
    type: 'success'
  });
  await logActivity({
    user: req.user._id,
    action: `Created ${role} ${user.name}`,
    entityType: 'User',
    entityId: user._id
  });
  res.status(201).json({ success: true, user: user.toSafeJSON() });
});

export const updateUser = asyncHandler(async (req, res) => {
  const allowed = ['name', 'email', 'phone', 'department', 'employeeId', 'studentId', 'isActive', 'role'];
  const payload = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) payload[k] = req.body[k];
  });
  if (req.body.password) payload.password = req.body.password;
  const user = await User.findById(req.params.id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  Object.assign(user, payload);
  await user.save();
  res.json({ success: true, user: user.toSafeJSON() });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.role === 'admin' && user._id.toString() === req.user._id.toString()) {
    const err = new Error('You cannot delete your own admin account');
    err.statusCode = 400;
    throw err;
  }
  await Promise.all([
    Enrollment.deleteMany({ student: user._id }),
    Course.updateMany({ faculty: user._id }, { faculty: null }),
    Submission.deleteMany({ student: user._id }),
    Grade.deleteMany({ student: user._id }),
    Notification.deleteMany({ user: user._id })
  ]);
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});
