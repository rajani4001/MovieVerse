import express from 'express';
import {
  getEnglishMovies,
  getSouthMovies,
  getFeaturedHindiMovies,
  getHindiMovies,
  getTrendingMovies,
  getPopularMovies,
  searchMovies,
  getMovieById,
} from '../controllers/movieController.js';

const router = express.Router();

router.get('/english', getEnglishMovies);
router.get('/south', getSouthMovies);
router.get('/hindi-featured', getFeaturedHindiMovies);
router.get('/hindi', getHindiMovies);
router.get('/trending', getTrendingMovies);
router.get('/popular', getPopularMovies);
router.get('/search', searchMovies);
router.get('/:id', getMovieById);

export default router;
