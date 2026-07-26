import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import * as userController from '../controllers/userController.js';

const router = Router();

router.get('/', authenticate, asyncHandler(userController.listUsers));

export default router;
