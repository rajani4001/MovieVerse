import express from 'express';
import {
  getStats,
  getMovies,
  addMovie,
  updateMovie,
  deleteMovie,
  getUsers,
  toggleBanUser,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/stats').get(protect, admin, getStats);
router.route('/movies').get(protect, admin, getMovies).post(protect, admin, addMovie);
router.route('/movies/:id').put(protect, admin, updateMovie).delete(protect, admin, deleteMovie);
router.route('/users').get(protect, admin, getUsers);
router.route('/ban-user/:id').patch(protect, admin, toggleBanUser);

export default router;
