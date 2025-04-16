import express from 'express';
import { getRecentActivity } from '../../controllers/dashboardTab/recentActivityController.js';
import { verifyToken } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/recent-activity', verifyToken, getRecentActivity); // This route is for getting recent activity

export default router;