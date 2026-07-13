// Mirrors backend/src/utils/validators.js
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// const PHONE_REGEX = /^\+?[0-9\s-]{7,15}$/;
const PHONE_REGEX = /^05\d{8}$/;

export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_REGEX.test(value.trim());
}

export function isValidPhone(value) {
  return typeof value === 'string' && PHONE_REGEX.test(value.trim());
}

export function validateDriverRow(row, { requireUsername = false } = {}) {
  const errors = [];

  if (!row.firstName || !row.firstName.trim()) errors.push('First Name is required');
  if (!row.lastName || !row.lastName.trim()) errors.push('Last Name is required');

  if (!row.email || !row.email.trim()) {
    errors.push('Email is required');
  } else if (!isValidEmail(row.email)) {
    errors.push('Email format is invalid');
  }

  if (!row.phone || !row.phone.trim()) {
    errors.push('Phone Number is required');
  } else if (!isValidPhone(row.phone)) {
    errors.push('Phone Number format is invalid');
  }

  if (requireUsername && (!row.username || !row.username.trim())) {
    errors.push('Username is required');
  }

  if (row.poExpiry && Number.isNaN(new Date(row.poExpiry).getTime())) {
    errors.push('PO Expiry date is invalid');
  }

  return errors;
}
