import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import * as authController from '../controllers/authController.js';

const router = Router();

router.post('/login', authLimiter, asyncHandler(authController.login));
router.post('/register', authLimiter, asyncHandler(authController.register));
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;

