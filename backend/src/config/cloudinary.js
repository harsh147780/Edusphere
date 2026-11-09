import { v2 as cloudinary } from 'cloudinary';

export const isCloudinaryEnabled = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

export const configureCloudinary = () => {
  if (!isCloudinaryEnabled()) return false;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  return true;
};

export const uploadToCloudinary = (filePath, folder = 'edusphere') =>
  cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto'
  });

export const destroyCloudinary = (publicId) => {
  if (!publicId || !isCloudinaryEnabled()) return Promise.resolve();
  return cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
};

export default cloudinary;
