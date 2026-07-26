
import { DRIVER_FIELDS } from './constants.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^05\d{8}$/;
const DEFAULT_MAX_FILE_SIZE_MB = 3;

export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_REGEX.test(value.trim());
}

export function isValidPhone(value) {
  return typeof value === 'string' && PHONE_REGEX.test(value.trim());
}

function isEmptyValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  return false;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}


export function validateField(field, value, { requireUsername = false, requireCreateFields = false } = {}) {
  if (!field) return null;

  if (field.key === 'username') {
    return requireUsername && isEmptyValue(value) ? 'Username is required' : null;
  }

  if (field.createOnly && !requireCreateFields) return null;

  if (field.required && isEmptyValue(value)) {
    return `${field.label} is required`;
  }

  if (isEmptyValue(value)) return null;

  if (field.key === 'email' && !isValidEmail(value)) {
    return 'Please enter a valid email address';
  }

  if (field.key === 'phone' && !isValidPhone(value)) {
    return 'Please enter a valid phone number.';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (field.minLength && trimmed.length < field.minLength) {
      return `${field.label} must be at least ${field.minLength} characters`;
    }
    if (field.maxLength && trimmed.length > field.maxLength) {
      return `${field.label} must be at most ${field.maxLength} characters`;
    }
    if (field.pattern && !field.pattern.test(trimmed)) {
      return field.patternMessage || `${field.label} contains invalid characters`;
    }
  }

  if (field.type === 'date') {
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) {
      return `${field.label} is invalid`;
    }
    if (field.noPastDate && time < startOfToday()) {
      return `${field.label} cannot be in the past`;
    }
  }

  if (field.type === 'select' && field.options && !field.options.includes(value)) {
    return `Please select a valid ${field.label}`;
  }

  if (field.type === 'file' && typeof File !== 'undefined' && value instanceof File) {
    const extension = value.name.split('.').pop()?.toLowerCase();
    if (field.allowedExtensions?.length && !field.allowedExtensions.includes(extension)) {
      return `${field.label} must be one of the following file types: ${field.allowedExtensions.join(', ')}`;
    }
    const maxSizeMB = field.maxSizeMB || DEFAULT_MAX_FILE_SIZE_MB;
    if (value.size > maxSizeMB * 1024 * 1024) {
      return `${field.label} must be smaller than ${maxSizeMB}MB`;
    }
  }

  return null;
}

const ROW_VALIDATED_KEYS = [
  'firstName', 'lastName', 'email', 'phone', 'username',
  'poNumber', 'poExpiry', 'licenseNumber', 'licenseExpiry', 'IDExpiry', 'hasInsurance', 'city',
];

export function validateDriverRow(row, { requireUsername = false, requireCreateFields = false } = {}) {
  const errors = [];

  ROW_VALIDATED_KEYS.forEach((key) => {
    const field = DRIVER_FIELDS.find((f) => f.key === key);
    const message = validateField(field, row[key], { requireUsername, requireCreateFields });
    if (message) errors.push(message);
  });

  return errors;
}

