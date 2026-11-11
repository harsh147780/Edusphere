import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import fs from 'fs';
import { backendRoot, uploadsDir } from './config/paths.js';
import { connectDB } from './config/db.js';

dotenv.config({ path: path.join(backendRoot, '.env') });
import { User } from './models/User.js';
import { Course } from './models/Course.js';
import { Enrollment } from './models/Enrollment.js';
import { CourseMaterial } from './models/CourseMaterial.js';
import { Assignment } from './models/Assignment.js';
import { Submission } from './models/Submission.js';
import { Grade } from './models/Grade.js';
import { Notification } from './models/Notification.js';
import { Activity } from './models/Activity.js';

const run = async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Enrollment.deleteMany({}),
    CourseMaterial.deleteMany({}),
    Assignment.deleteMany({}),
    Submission.deleteMany({}),
    Grade.deleteMany({}),
    Notification.deleteMany({}),
    Activity.deleteMany({})
  ]);

  const admin = await User.create({
    name: 'Ava Sterling',
    email: 'admin@edusphere.com',
    password: 'Admin@123',
    role: 'admin',
    department: 'Administration',
    phone: '+1 555 0100'
  });

  const faculty = await User.create([
    {
      name: 'Dr. Maya Chen',
      email: 'maya.chen@edusphere.com',
      password: 'Faculty@123',
      role: 'faculty',
      department: 'Computer Science',
      employeeId: 'FAC-1001',
      phone: '+1 555 0101'
    },
    {
      name: 'Prof. Liam Brooks',
      email: 'liam.brooks@edusphere.com',
      password: 'Faculty@123',
      role: 'faculty',
      department: 'Mathematics',
      employeeId: 'FAC-1002',
      phone: '+1 555 0102'
    },
    {
      name: 'Dr. Sofia Alvarez',
      email: 'sofia.alvarez@edusphere.com',
      password: 'Faculty@123',
      role: 'faculty',
      department: 'Business',
      employeeId: 'FAC-1003',
      phone: '+1 555 0103'
    }
  ]);

  const students = await User.create([
    { name: 'Noah Patel', email: 'noah.patel@edusphere.com', password: 'Student@123', role: 'student', department: 'Computer Science', studentId: 'STU-2401' },
    { name: 'Emma Johansson', email: 'emma.j@edusphere.com', password: 'Student@123', role: 'student', department: 'Computer Science', studentId: 'STU-2402' },
    { name: 'Oliver Kim', email: 'oliver.kim@edusphere.com', password: 'Student@123', role: 'student', department: 'Mathematics', studentId: 'STU-2403' },
    { name: 'Isla Rahman', email: 'isla.rahman@edusphere.com', password: 'Student@123', role: 'student', department: 'Business', studentId: 'STU-2404' },
    { name: 'Ethan Cole', email: 'ethan.cole@edusphere.com', password: 'Student@123', role: 'student', department: 'Computer Science', studentId: 'STU-2405' },
    { name: 'Aria Singh', email: 'aria.singh@edusphere.com', password: 'Student@123', role: 'student', department: 'Business', studentId: 'STU-2406' }
  ]);

  const courses = await Course.create([
    {
      title: 'Full-Stack Web Engineering',
      code: 'CS401',
      description: 'Build production MERN applications with authentication, APIs and modern UI.',
      credits: 4,
      faculty: faculty[0]._id,
      department: 'Computer Science',
      semester: 'Fall',
      academicYear: '2026'
    },
    {
      title: 'Data Structures & Algorithms',
      code: 'CS302',
      description: 'Core algorithmic thinking, complexity analysis and problem solving.',
      credits: 4,
      faculty: faculty[0]._id,
      department: 'Computer Science',
      semester: 'Fall',
      academicYear: '2026'
    },
    {
      title: 'Linear Algebra for Computing',
      code: 'MA210',
      description: 'Vectors, matrices and transformations for machine learning and graphics.',
      credits: 3,
      faculty: faculty[1]._id,
      department: 'Mathematics',
      semester: 'Fall',
      academicYear: '2026'
    },
    {
      title: 'Product Strategy',
      code: 'BUS330',
      description: 'Market research, positioning and go-to-market for digital products.',
      credits: 3,
      faculty: faculty[2]._id,
      department: 'Business',
      semester: 'Fall',
      academicYear: '2026'
    }
  ]);

  const pairs = [
    [0, 0], [0, 1], [1, 0], [1, 1], [2, 1], [2, 2], [3, 3], [4, 0], [4, 2], [5, 3]
  ];
  await Enrollment.insertMany(
    pairs.map(([si, ci]) => ({
      student: students[si]._id,
      course: courses[ci]._id,
      enrolledBy: admin._id
    }))
  );

  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(
    path.join(uploadsDir, 'sample-architecture.txt'),
    'EduSphere Week 1 — layered architecture notes for the LMS platform.\n'
  );

  await CourseMaterial.create([
    {
      course: courses[0]._id,
      uploadedBy: faculty[0]._id,
      title: 'Week 1 — Architecture notes',
      description: 'Layered architecture for LMS platforms.',
      fileUrl: '/uploads/sample-architecture.txt',
      fileName: 'architecture-notes.txt',
      fileType: 'text/plain'
    }
  ]);

  const dueSoon = new Date();
  dueSoon.setDate(dueSoon.getDate() + 7);
  const duePast = new Date();
  duePast.setDate(duePast.getDate() - 2);

  const assignments = await Assignment.create([
    {
      course: courses[0]._id,
      createdBy: faculty[0]._id,
      title: 'REST API Design Brief',
      description: 'Design REST endpoints for course enrollment with role-based access.',
      dueDate: dueSoon,
      maxMarks: 100
    },
    {
      course: courses[0]._id,
      createdBy: faculty[0]._id,
      title: 'Auth Flow Lab',
      description: 'Implement JWT cookie authentication and protected routes.',
      dueDate: duePast,
      maxMarks: 50
    }
  ]);

  await Notification.insertMany([
    {
      user: students[0]._id,
      title: 'Welcome to EduSphere',
      message: 'You are enrolled in Full-Stack Web Engineering.',
      type: 'enrollment',
      link: `/student/courses/${courses[0]._id}`
    },
    {
      user: faculty[0]._id,
      title: 'Course assigned',
      message: 'You are teaching CS401 this semester.',
      type: 'info'
    }
  ]);

  await Activity.create({
    user: admin._id,
    action: 'Seeded EduSphere demo data',
    entityType: 'System'
  });

  console.log('Seed complete.');
  console.log('Admin:   admin@edusphere.com / Admin@123');
  console.log('Faculty: maya.chen@edusphere.com / Faculty@123');
  console.log('Student: noah.patel@edusphere.com / Student@123');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
