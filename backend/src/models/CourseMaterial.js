import mongoose from 'mongoose';

const courseMaterialSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    publicId: { type: String, default: '' }
  },
  { timestamps: true }
);

export const CourseMaterial = mongoose.model('CourseMaterial', courseMaterialSchema);
