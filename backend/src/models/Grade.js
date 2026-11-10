import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema(
  {
    submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true, unique: true },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    marks: { type: Number, required: true, min: 0 },
    letterGrade: { type: String, default: '' },
    feedback: { type: String, default: '' },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date }
  },
  { timestamps: true }
);

export const Grade = mongoose.model('Grade', gradeSchema);
