import { ApiError } from '../utils/ApiError.js';
import { verifyToken, sanitizeUser } from '../services/authService.js';
import { userRepository } from '../data/index.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError('Not authenticated', 401));
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return next(new ApiError('Invalid or expired token', 401));
  }

  const user = await userRepository.findById(payload.id);
  if (!user || !user.isActive) {
    return next(new ApiError('Not authenticated', 401));
  }

  req.user = sanitizeUser(user);
  next();
}
