import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import * as driverController from '../controllers/driverController.js';

const router = Router();

router.get('/my-completed', authenticate, asyncHandler(driverController.myCompletedDrivers));

export default router;
