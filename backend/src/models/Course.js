import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    credits: { type: Number, required: true, min: 1, max: 10, default: 3 },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    department: { type: String, required: true, trim: true },
    semester: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    thumbnail: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

courseSchema.index({ title: 'text', code: 'text', department: 'text' });

export const Course = mongoose.model('Course', courseSchema);
