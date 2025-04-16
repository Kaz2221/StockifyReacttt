import express from 'express';
import salesRoutes from './salesRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';

const router = express.Router();

router.use(salesRoutes);
router.use(inventoryRoutes)
//router.use('/api',expensesRoutes);
//router.use('/api',cashflowRoutes);

export default router;
