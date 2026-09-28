import multer from 'multer';
import { Request } from 'express';
import { config } from '../config';
import { BadRequestError } from '../utils/errors';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new BadRequestError('Only JPEG, PNG, WEBP images or PDF files are accepted'));
  }
  cb(null, true);
};

/**
 * Single-file upload for a `file` field, buffered in memory rather than
 * written straight to disk — storage.service then decides whether those
 * bytes land on local disk or in an S3-compatible bucket, based on
 * STORAGE_DRIVER, without multer needing to know which.
 */
export const uploadSingleFile = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: config.upload.maxBytes },
}).single('file');
