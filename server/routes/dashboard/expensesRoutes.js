import express from 'express';
import { getExpensesLast30Days } from '../../controllers/dashboardTab/expensesController.js';
import { verifyToken } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/expenses-last-30-days', verifyToken, getExpensesLast30Days);

export default router;
