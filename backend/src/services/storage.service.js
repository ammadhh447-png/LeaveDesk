import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCloudinary, isCloudinaryEnabled } from '../config/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_UPLOAD_DIR = path.join(__dirname, '../../uploads');

const sanitizeFileName = (name = 'file') => `${Date.now()}-${name.replace(/\s/g, '_')}`;

const getResourceType = (mimetype = '') => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'raw';
  if (mimetype.includes('word') || mimetype.includes('document')) return 'raw';
  return 'auto';
};

const formatCloudinaryError = (error) => {
  const detail = error?.error?.message || error?.message || 'Cloudinary upload failed.';

  if (error?.http_code === 403) {
    return 'Cloudinary upload blocked. Use the Root API key, or assign your API key the Master Admin role in Cloudinary → Settings → API Keys.';
  }

  return detail;
};

const getCloudinaryPublicId = (url) => {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('res.cloudinary.com')) return null;

    const match = parsed.pathname.match(/\/upload\/(?:v\d+\/)?(.+)\.[^/]+$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
};

const uploadToCloudinary = async (file, folder) => {
  const cloudinary = getCloudinary();
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  const resourceType = getResourceType(file.mimetype);
  const fileName = sanitizeFileName(file.originalname).replace(/\.[^.]+$/, '');

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `leavedesk/${folder}`,
      resource_type: resourceType,
      public_id: fileName,
    });

    return {
      url: result.secure_url,
      storagePath: result.public_id,
      provider: 'cloudinary',
    };
  } catch (error) {
    throw new Error(formatCloudinaryError(error));
  }
};

const uploadLocally = async (file, folder) => {
  const fileName = sanitizeFileName(file.originalname);
  const storagePath = `${folder}/${fileName}`;
  const fullPath = path.join(LOCAL_UPLOAD_DIR, storagePath);

  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, file.buffer);

  return {
    url: `/uploads/${storagePath.replace(/\\/g, '/')}`,
    storagePath: `/uploads/${storagePath.replace(/\\/g, '/')}`,
    provider: 'local',
  };
};

export const storeUploadedFile = async (file, folder) => {
  if (!file?.buffer) {
    throw new Error('Uploaded file buffer is missing.');
  }

  if (isCloudinaryEnabled()) {
    return uploadToCloudinary(file, folder);
  }

  return uploadLocally(file, folder);
};

export const deleteStoredFile = async (storedUrl) => {
  if (!storedUrl) return;

  if (storedUrl.startsWith('http://') || storedUrl.startsWith('https://')) {
    if (!isCloudinaryEnabled()) return;

    const publicId = getCloudinaryPublicId(storedUrl);
    if (!publicId) return;

    try {
      const cloudinary = getCloudinary();
      await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
    } catch (error) {
      if (error?.http_code !== 404) {
        console.error('Cloudinary file delete failed:', error.message);
      }
    }
    return;
  }

  if (storedUrl.startsWith('/uploads/')) {
    const relativePath = storedUrl.slice('/uploads/'.length);
    const localPath = path.join(LOCAL_UPLOAD_DIR, relativePath);

    try {
      await fs.unlink(localPath);
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        console.error('Local file delete failed:', error.message);
      }
    }
  }
};

export const getStorageProvider = () => {
  if (isCloudinaryEnabled()) return 'cloudinary';
  return 'local';
};
