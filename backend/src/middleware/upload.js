import crypto from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const ATTACHMENT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
const ATTACHMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const attachmentUpload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    const ok = ATTACHMENT_EXTENSIONS.includes(ext) && ATTACHMENT_MIME_TYPES.includes(file.mimetype);
    if (!ok) {
      return cb(new ApiError('Only PDF, JPG, JPEG, PNG files are allowed', 400));
    }
    cb(null, true);
  },
});

const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Some browsers/clients send a generic type for .xlsx; the extension check
  // above still gates on the real file name, so this stays safe to allow.
  'application/octet-stream',
];

export const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.xlsx$/i.test(file.originalname) && EXCEL_MIME_TYPES.includes(file.mimetype);
    if (!ok) {
      return cb(new ApiError('Only .xlsx files are accepted', 400));
    }
    cb(null, true);
  },
});
