import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/response';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Hand handlers the parsed body, so schema transforms (trim, lowercase)
      // and defaults actually apply instead of being validated then discarded.
      if (parsed.body !== undefined) req.body = parsed.body;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return sendError(res, 'Validation failed', 400, issues);
      }
      return next(error);
    }
  };
};
