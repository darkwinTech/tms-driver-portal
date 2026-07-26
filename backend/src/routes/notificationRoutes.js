import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import * as notificationController from '../controllers/notificationController.js';

const router = Router();

router.get('/', authenticate, asyncHandler(notificationController.list));
router.patch('/read-all', authenticate, asyncHandler(notificationController.markAllRead));

export default router;

