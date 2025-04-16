import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { addSale, getSales ,updateSale, deleteSale, getFullSales } from '../controllers/salesTab/salesController.js';

const router = express.Router();

router.get('/', verifyToken, getSales); // This route is for getting all sales
router.get('/full', verifyToken, getFullSales);
router.post('/', verifyToken, addSale); // This route is for adding a sale
router.put('/:id', verifyToken, updateSale); // This route is for updating a sale
router.delete('/:id', verifyToken, deleteSale); // This route is for deleting a sale
export default router;  