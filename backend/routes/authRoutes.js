import express from 'express';
import { authUser, registerUser, forgotPassword, resetPassword, getProfile, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', authUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);

export default router;
