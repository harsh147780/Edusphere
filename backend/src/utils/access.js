import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';

export const assertCourseAccess = async (user, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'admin') return course;

  if (user.role === 'faculty') {
    if (!course.faculty || course.faculty.toString() !== user._id.toString()) {
      const err = new Error('You can only manage assigned courses');
      err.statusCode = 403;
      throw err;
    }
    return course;
  }

  const enrolled = await Enrollment.findOne({
    student: user._id,
    course: courseId,
    status: 'active'
  });
  if (!enrolled) {
    const err = new Error('You can only access enrolled courses');
    err.statusCode = 403;
    throw err;
  }
  return course;
};
