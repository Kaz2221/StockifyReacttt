import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { getSubscriptions, createSubscription, updateSubscription, deleteSubscription } from '../controllers/subscriptionTab/subscriptionController.js';
const router = express.Router();

router.get('/', verifyToken, getSubscriptions); // This route is for getting all subscriptions
router.post('/', verifyToken, createSubscription); // This route is for adding a subscription
router.put('/:id', verifyToken, updateSubscription); // This route is for updating a subscription
router.delete('/:id', verifyToken, deleteSubscription); // This route is for deleting a subscription

export default router;