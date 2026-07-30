import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { attachmentUpload, excelUpload } from '../middleware/upload.js';
import * as requestController from '../controllers/requestController.js';

const router = Router();

router.use(authenticate);

router.get('/stats', asyncHandler(requestController.getStats));
router.get('/excel-template', asyncHandler(requestController.downloadExcelTemplate));
router.post('/excel-upload', excelUpload.single('file'), asyncHandler(requestController.uploadExcel));

router.get('/', asyncHandler(requestController.listRequests));
router.post('/', asyncHandler(requestController.createRequest));

router.get('/:id', asyncHandler(requestController.getRequest));
router.put('/:id/resubmit', asyncHandler(requestController.resubmitRequest));
router.patch('/:id/status', asyncHandler(requestController.updateStatus));

router.patch(
  '/:id/drivers/:driverId/profile',
  requireRole('Operations'),
  asyncHandler(requestController.updateDriverProfile)
);
router.post(
  '/:id/complete-driver-profiles',
  requireRole('Operations'),
  asyncHandler(requestController.completeDriverProfiles)
);
router.post('/:id/mark-complete', requireRole('AD Team'), asyncHandler(requestController.markComplete));

router.post('/:id/attachments', attachmentUpload.single('file'), asyncHandler(requestController.uploadAttachment));
router.get('/:id/attachments/:attachmentId', asyncHandler(requestController.previewAttachment));
router.get('/:id/attachments/:attachmentId/download', asyncHandler(requestController.downloadAttachment));

router.get('/:id/drivers/export', asyncHandler(requestController.exportDrivers));

export default router;


