import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { addItem, getItems, updateItem, deleteItem } from '../controllers/inventoryTab/inventoryController.js'; 

const router = express.Router();

router.post('/', verifyToken, addItem);
router.get('/', verifyToken, getItems); // This route is for getting all items
router.put('/:id', verifyToken, updateItem); // This route is for updating an item
router.delete('/:id', verifyToken, deleteItem); // This route is for deleting an item

export default router;