// Client-side mirror of server/src/services/validators.js - keeps the two
// in lockstep so a driver row that passes here is guaranteed to pass the
// backend's check (and vice versa).
import { DRIVER_FIELDS } from './constants.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^05\d{8}$/;

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

/**
 * Validates a single driver field in isolation. Shared by the row-level
 * check (validateDriverRow) and DriverTable's live per-cell validation so
 * the two can never drift apart.
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

  if (field.key === 'email' && !isEmptyValue(value) && !isValidEmail(value)) {
    return 'Please enter a valid email address';
  }

  if (field.key === 'phone' && !isEmptyValue(value) && !isValidPhone(value)) {
    return 'Please enter a valid phone number.';
  }

  if (
    (field.key === 'poExpiry' || field.key === 'licenseExpiry') &&
    !isEmptyValue(value) &&
    Number.isNaN(new Date(value).getTime())
  ) {
    return `${field.label} is invalid`;
  }

  return null;
}

const ROW_VALIDATED_KEYS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'username',
  'poExpiry',
  'licenseNumber',
  'licenseExpiry',
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
