import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { destroyCloudinary, isCloudinaryEnabled, uploadToCloudinary } from '../config/cloudinary.js';
import { uploadsDir } from '../config/paths.js';

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const allowed = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/zip'
]);

export const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowed.has(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
});

export const persistFile = async (file, folder = 'edusphere') => {
  if (!file) return null;
  if (isCloudinaryEnabled()) {
    const result = await uploadToCloudinary(file.path, folder);
    fs.unlink(file.path, () => {});
    return {
      url: result.secure_url,
      publicId: result.public_id,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size
    };
  }
  return {
    url: `/uploads/${path.basename(file.path)}`,
    publicId: '',
    fileName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size
  };
};

export const removeStoredFile = async (fileUrl, publicId) => {
  await destroyCloudinary(publicId);
  if (fileUrl?.startsWith('/uploads/')) {
    const abs = path.join(uploadsDir, path.basename(fileUrl));
    if (fs.existsSync(abs)) fs.unlink(abs, () => {});
  }
};
