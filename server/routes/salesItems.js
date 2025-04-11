import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { getSalesItems, addSaleItem, deleteSaleItem,updateSaleItem } from '../controllers/salesItemsController.js';
const router = express.Router();

router.get('/', verifyToken, getSalesItems); // This route is for getting a specific sale by ID
router.post('/', verifyToken, addSaleItem); // This route is for adding a sale item
router.put('/:id', verifyToken, updateSaleItem); // This route is for updating a sale item  
router.delete('/:id', verifyToken, deleteSaleItem); // This route is for deleting a sale item
export default router;  