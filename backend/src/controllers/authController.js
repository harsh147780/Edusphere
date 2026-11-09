import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cookieOptions, sendToken } from '../middleware/auth.js';
import { persistFile } from '../middleware/upload.js';
import { logActivity } from '../utils/notify.js';
import { httpError } from '../utils/httpError.js';
import crypto from 'crypto';

// Resolves a login/recovery identifier that may be an email, a student ID or an employee ID.
const findByIdentifier = (raw) => {
  const identifier = String(raw || '').trim();
  if (!identifier) return null;
  const query = identifier.includes('@')
    ? { email: identifier.toLowerCase() }
    : { $or: [{ studentId: identifier }, { employeeId: identifier }] };
  return User.findOne(query);
};

export const login = asyncHandler(async (req, res) => {
  const { password, role } = req.body;
  const identifier = req.body.email || req.body.identifier;
  if (!identifier || !password) {
    throw httpError(400, 'Email or ID and password are required');
  }

  const user = await findByIdentifier(identifier).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  if (!user.isActive) {
    const err = new Error('Account is deactivated');
    err.statusCode = 403;
    throw err;
  }
  if (role && user.role !== role) {
    const err = new Error(`This account is not registered as ${role}`);
    err.statusCode = 403;
    throw err;
  }

  await logActivity({ user: user._id, action: 'Logged in' });
  sendToken(user, 200, res);
});

export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', cookieOptions({ expires: new Date(0), maxAge: 0 }));
  res.json({ success: true, message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updates = {
    name: req.body.name ?? req.user.name,
    phone: req.body.phone ?? req.user.phone,
    department: req.body.department ?? req.user.department
  };
  if (req.file) {
    const stored = await persistFile(req.file, 'edusphere/avatars');
    updates.avatar = stored.url;
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, user: user.toSafeJSON() });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword || ''))) {
    const err = new Error('Current password is incorrect');
    err.statusCode = 400;
    throw err;
  }
  if (!newPassword || newPassword.length < 6) {
    const err = new Error('New password must be at least 6 characters');
    err.statusCode = 400;
    throw err;
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const identifier = req.body.email || req.body.identifier;
  if (!identifier) throw httpError(400, 'Email or ID is required');
  const user = await findByIdentifier(identifier);
  // Generic response to avoid leaking which accounts exist.
  const payload = { success: true, message: 'If an account matches, a reset code has been generated.' };
  if (!user) return res.json(payload);
  if (!user.isActive) throw httpError(403, 'Account is deactivated. Contact your administrator.');
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // In production the code would be emailed. No mail service is configured here, so in
  // development we return it once so the recovery flow is usable and testable.
  if (process.env.NODE_ENV !== 'production') {
    payload.resetToken = resetToken;
    payload.message = 'Use the reset code below to set a new password. It expires in 30 minutes.';
  }
  res.json(payload);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) throw httpError(400, 'Reset code and new password are required');
  if (String(newPassword).length < 6) throw httpError(400, 'Password must be at least 6 characters');
  const hashed = crypto.createHash('sha256').update(String(token).trim()).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: Date.now() } });
  if (!user) throw httpError(400, 'Reset code is invalid or has expired');
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  await logActivity({ user: user._id, action: 'Reset password' });
  res.json({ success: true, message: 'Password updated. You can now sign in.' });
});
