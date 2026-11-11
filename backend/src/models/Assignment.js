import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, required: true },
    maxMarks: { type: Number, required: true, min: 1, default: 100 },
    attachmentUrl: { type: String, default: '' },
    attachmentName: { type: String, default: '' },
    publicId: { type: String, default: '' },
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Assignment = mongoose.model('Assignment', assignmentSchema);
