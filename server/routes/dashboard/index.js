import express from 'express';
import salesRoutes from './salesRoutes.js';


const router = express.Router();

router.use(salesRoutes);
//router.use('/api',expensesRoutes);
//router.use('/api',cashflowRoutes);

export default router;
