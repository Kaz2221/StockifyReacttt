import express from 'express';
import salesRoutes from './salesRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import expensesRoutes from './expensesRoutes.js';

const router = express.Router();

router.use(salesRoutes);
router.use(inventoryRoutes);
router.use(expensesRoutes);
//router.use('/api',cashflowRoutes);

export default router;
