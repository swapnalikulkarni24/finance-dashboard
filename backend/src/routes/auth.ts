// backend/src/routes/auth.ts
import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware'; // We'll create this next

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe); // Protected route to get current user info

export default router;
