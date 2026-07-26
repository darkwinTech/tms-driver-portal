import multer from 'multer';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: 'File exceeds the allowed size limit',
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message, ...err.extra });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: MULTER_MESSAGES[err.code] || err.message });
  }

  if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}

