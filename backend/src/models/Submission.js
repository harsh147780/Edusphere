import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    publicId: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['submitted', 'late', 'graded'], default: 'submitted' }
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export const Submission = mongoose.model('Submission', submissionSchema);
