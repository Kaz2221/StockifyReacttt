import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { addExpense,  getExpenses, updateExpense, deleteExpense } from '../controllers/expensesTab/expensesController.js';

const router = express.Router();

router.get('/', verifyToken, getExpenses); // This route is for getting all expenses
router.post('/', verifyToken, addExpense); // This route is for adding an expense
router.put('/:id', verifyToken, updateExpense); // This route is for updating an expense
router.delete('/:id', verifyToken, deleteExpense);
export default router;