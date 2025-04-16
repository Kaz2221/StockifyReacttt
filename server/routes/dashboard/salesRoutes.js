import express from 'express';
import { getSalesLast30Days } from '../../controllers/dashboardTab/salesController.js';
import { verifyToken } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/sales-last-30-days', verifyToken, getSalesLast30Days);

export default router;
