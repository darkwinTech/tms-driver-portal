import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import driverRoutes from './driverRoutes.js';
import requestRoutes from './requestRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/drivers', driverRoutes);
router.use('/requests', requestRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);

export default router;

