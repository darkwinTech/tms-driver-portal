import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import * as authController from '../controllers/authController.js';

const router = Router();

router.post('/login', asyncHandler(authController.login));
router.post('/register', asyncHandler(authController.register));
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;

