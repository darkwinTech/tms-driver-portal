// Client-side mirror of server/src/services/validators.js - keeps the two
// in lockstep so a driver row that passes here is guaranteed to pass the
// backend's check (and vice versa).
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

/**
 * Validates a single driver field in isolation. Shared by the row-level
 * check (validateDriverRow) and DriverTable's live per-cell validation so
 * the two can never drift apart. Covers required-ness, format (email/phone),
 * length bounds, allowed-character patterns, date validity/business rules,
 * dropdown membership, and file type/size for attachment fields.
 */
export function validateField(field, value, { requireUsername = false, requireCreateFields = false } = {}) {
  if (!field) return null;

  if (field.key === 'username') {
    return requireUsername && isEmptyValue(value) ? 'Username is required' : null;
  }

  // createOnly fields (Driver License Number, etc.) only apply to Create Driver requests
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

  if (field.type === 'file' && value instanceof File) {
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
  'firstName',
  'lastName',
  'email',
  'phone',
  'username',
  'poNumber',
  'poExpiry',
  'licenseNumber',
  'licenseExpiry',
  'IDExpiry',
  'hasInsurance',
  'city',
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

// Finds rows within the same batch (manual entry table) that share a
// License/ID/IQAMA number. Mirrors the backend's check for immediate
// feedback - the system-wide check still needs the backend, since the
// browser has no view of every driver ever entered.
export function findDuplicateLicenseNumberIndexes(drivers) {
  const seen = new Map();
  const duplicates = new Set();
  drivers.forEach((driver, idx) => {
    const value = (driver.licenseNumber || '').trim();
    if (!value) return;
    if (seen.has(value)) {
      duplicates.add(seen.get(value));
      duplicates.add(idx);
    } else {
      seen.set(value, idx);
    }
  });
  return duplicates;
}
