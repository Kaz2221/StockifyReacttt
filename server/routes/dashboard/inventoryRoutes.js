import express from 'express';
import { getInventoryCostLast30Days } from '../../controllers/dashboardTab/inventoryController.js';
import { verifyToken } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/inventory-cost-last-30-days', verifyToken, getInventoryCostLast30Days);

export default router;