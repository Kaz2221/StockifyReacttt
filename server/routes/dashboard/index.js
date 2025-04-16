import express from 'express';
import salesRoutes from './salesRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import expensesRoutes from './expensesRoutes.js';
import recentActivity from './recentActivityRoute.js';

const router = express.Router();

router.use(salesRoutes);
router.use(inventoryRoutes);
router.use(expensesRoutes);
router.use(recentActivity);
//router.use('/api',cashflowRoutes);

export default router;
