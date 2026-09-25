import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request } from 'express';
import { config } from '../config';
import { BadRequestError } from '../utils/errors';

const uploadRoot = path.resolve(process.cwd(), config.upload.dir);
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new BadRequestError('Only JPEG, PNG, WEBP images or PDF files are accepted'));
  }
  cb(null, true);
};

/** Single-file upload for a `file` field. Used for prescription uploads etc. */
export const uploadSingleFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxBytes },
}).single('file');

export const publicUploadUrl = (filename: string): string => `${config.appBaseUrl}/uploads/${filename}`;
