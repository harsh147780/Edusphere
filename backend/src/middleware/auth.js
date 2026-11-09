import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    const err = new Error('Not authorized');
    err.statusCode = 401;
    throw err;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      const err = new Error('Account is inactive or not found');
      err.statusCode = 401;
      throw err;
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.statusCode) throw error;
    const err = new Error('Not authorized');
    err.statusCode = 401;
    throw err;
  }
});

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const err = new Error('Forbidden');
      err.statusCode = 403;
      return next(err);
    }
    next();
  };

export const cookieOptions = (overrides = {}) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  ...overrides
});

export const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

export const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.cookie('token', token, cookieOptions({ maxAge: 7 * 24 * 60 * 60 * 1000 }));
  res.status(statusCode).json({ success: true, user: user.toSafeJSON() });
};
