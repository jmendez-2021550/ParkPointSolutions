import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import { config } from '../configs/config.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const normalizePath = (filePath) => filePath.replace(/\\/g, '/');

export const uploadImage = async (filePath, fileName) => {
  try {
    const normalizedPath = normalizePath(filePath);
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const result = await cloudinary.uploader.upload(normalizedPath, {
      public_id: fileNameWithoutExt,
      folder: config.cloudinary.folder,
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    try {
      await fs.unlink(normalizedPath);
    } catch (cleanupError) {
      console.warn('Could not delete local file after upload:', cleanupError.message);
    }

    if (result.secure_url) {
      return result.secure_url;
    }
    throw new Error('Cloudinary upload did not return a secure_url');
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    throw error;
  }
};

export const getFullImageUrl = (imagePath) => {
  if (!imagePath) {
    return getDefaultAvatarUrl();
  }

  if (imagePath.startsWith('https://') || imagePath.startsWith('http://')) {
    return imagePath;
  }

  const baseUrl = config.cloudinary.baseUrl || `https://res.cloudinary.com/${config.cloudinary.cloudName}/image/upload/`;
  const pathToUse = imagePath.includes('/') ? imagePath : `${config.cloudinary.folder}/${imagePath}`;
  return `${baseUrl}${pathToUse}`;
};

export const getDefaultAvatarUrl = () => {
  const defaultPath = config.cloudinary.defaultAvatarPath;
  if (!defaultPath) return '';
  return getFullImageUrl(defaultPath);
};

export const getDefaultAvatarPath = () => {
  return config.cloudinary.defaultAvatarPath || '';
};

export const deleteImage = async (imagePath) => {
  if (!imagePath || imagePath === config.cloudinary.defaultAvatarPath) {
    return true;
  }

  let publicId = imagePath;
  if (imagePath.includes('cloudinary.com')) {
    const urlParts = imagePath.split('/upload/');
    if (urlParts.length > 1) {
      publicId = urlParts[1].replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
    }
  }

  const result = await cloudinary.uploader.destroy(publicId);
  return result.result === 'ok';
};
