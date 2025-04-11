import express from 'express';
import { registerUser, loginUser  } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser); // 🔁 Route forwards to controller
router.post('/login', loginUser);
export default router;
