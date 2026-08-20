import express from 'express';
import { getHistory, addHistory, deleteHistory, clearHistory } from '../controllers/historyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getHistory).post(protect, addHistory).delete(protect, clearHistory);
router.route('/:id').delete(protect, deleteHistory);

export default router;
