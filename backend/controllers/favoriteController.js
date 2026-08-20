import Favorite from '../models/Favorite.js';

// @desc    Get user favorites
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id });
    
    // Transform to maintain compatibility with frontend which expects fav.movie.title etc.
    const transformed = favorites.map(fav => ({
      ...fav._doc,
      movie: {
        _id: fav.movie,
        title: fav.title,
        poster: fav.poster,
        releaseDate: fav.releaseDate,
        vote_average: fav.vote_average
      }
    }));

    res.json(transformed);
  } catch (error) {
    next(error);
  }
};

// @desc    Add movie to favorites
// @route   POST /api/favorites
// @access  Private
const addFavorite = async (req, res, next) => {
  try {
    const { movieId, title, poster, releaseDate, vote_average } = req.body;

    const exists = await Favorite.findOne({ user: req.user._id, movie: movieId });
    if (exists) {
      return res.status(400).json({ message: 'Movie already in favorites' });
    }

    const favorite = await Favorite.create({
      user: req.user._id,
      movie: movieId,
      title,
      poster,
      releaseDate,
      vote_average,
    });

    res.status(201).json(favorite);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove movie from favorites
// @route   DELETE /api/favorites/:movieId
// @access  Private
const removeFavorite = async (req, res, next) => {
  try {
    // Note: movieId in param is the actual Movie Document ID, not the Favorite ID
    const favorite = await Favorite.findOne({
      user: req.user._id,
      movie: req.params.movieId,
    });

    if (favorite) {
      await favorite.deleteOne();
      res.json({ message: 'Removed from favorites' });
    } else {
      res.status(404);
      throw new Error('Favorite not found');
    }
  } catch (error) {
    next(error);
  }
};

export { getFavorites, addFavorite, removeFavorite };
