import express from 'express';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/favoriteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getFavorites).post(protect, addFavorite);
router.route('/:movieId').delete(protect, removeFavorite);

export default router;
