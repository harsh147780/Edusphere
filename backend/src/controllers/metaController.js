import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const lookups = asyncHandler(async (_req, res) => {
  const [courseDepartments, userDepartments, semesters, years] = await Promise.all([
    Course.distinct('department'),
    User.distinct('department'),
    Course.distinct('semester'),
    Course.distinct('academicYear')
  ]);
  const departments = [...new Set([...courseDepartments, ...userDepartments].filter(Boolean))].sort();
  res.json({
    success: true,
    departments,
    semesters: semesters.filter(Boolean).sort(),
    academicYears: years.filter(Boolean).sort()
  });
});
