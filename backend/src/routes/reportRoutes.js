import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import * as reportController from '../controllers/reportController.js';

const router = Router();

router.use(authenticate, requireRole('Processor'));

router.get('/monthly', asyncHandler(reportController.monthly));
router.get('/completed', asyncHandler(reportController.completed));
router.get('/rejected', asyncHandler(reportController.rejected));
router.get('/export', asyncHandler(reportController.exportExcel));

export default router;

