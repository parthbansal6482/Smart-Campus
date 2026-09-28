import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';
import { saveUploadedFile } from '../../services/storage.service';

export class UploadsController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError('No file was provided');
      }

      const { url } = await saveUploadedFile(req.file);
      return sendSuccess(res, { url, originalName: req.file.originalname, size: req.file.size }, 'File uploaded successfully', 201);
    } catch (error) {
      return next(error);
    }
  }
}

export const uploadsController = new UploadsController();
