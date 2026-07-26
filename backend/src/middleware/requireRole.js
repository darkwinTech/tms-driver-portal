import { ApiError } from '../utils/ApiError.js';
 
export function requireRole(...roles) {
  return (req, res, next) => {
    if (req.user?.role === 'Admin' || roles.includes(req.user?.role)) {
      return next();
    }
    next(new ApiError('Forbidden', 403));
  };
}
