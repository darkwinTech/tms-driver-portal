import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

// Field set returned to the client / attached to req.user - never includes
// passwordHash.
export function sanitizeUser(user) {
  const { id, employeeId, fullName, email, department, role, managerId } = user;
  return { id, employeeId, fullName, email, department, role, managerId };
}
