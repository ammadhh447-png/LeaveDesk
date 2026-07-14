import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const allowedExt = new Set(['jpeg', 'jpg', 'png', 'gif', 'pdf', 'doc', 'docx']);
  const allowedMime = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

  if (allowedExt.has(ext) && (allowedMime.has(file.mimetype) || file.mimetype === 'application/octet-stream')) {
    cb(null, true);
    return;
  }

  cb(new Error('Only images (JPG, PNG, GIF) and documents (PDF, DOC, DOCX) are allowed.'), false);
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
