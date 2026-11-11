import fs from 'fs';
import path from 'path';
import { httpError } from './httpError.js';
import { uploadsDir } from '../config/paths.js';

export const sendStoredFile = (res, fileUrl, downloadName) => {
  if (!fileUrl) throw httpError(404, 'File not found');

  if (/^https?:\/\//i.test(fileUrl)) {
    return res.redirect(fileUrl);
  }

  const filename = path.basename(fileUrl);
  const abs = path.join(uploadsDir, filename);
  if (!abs.startsWith(uploadsDir) || !fs.existsSync(abs)) {
    throw httpError(404, 'File missing on server');
  }

  return res.download(abs, downloadName || filename);
};
