import { Router } from 'express';
import { signup, signupManager, login, logout, getMe, verifySession, refreshToken } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

router.post('/signup', asyncHandler(signup));
router.post('/signup/manager', asyncHandler(signupManager));
router.post('/login', asyncHandler(login));
router.post('/logout', protect, asyncHandler(logout));
router.get('/me', protect, asyncHandler(getMe));
router.get('/verify', protect, asyncHandler(verifySession));
router.post('/refresh', protect, asyncHandler(refreshToken));

export default router;
