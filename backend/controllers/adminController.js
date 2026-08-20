import Movie from '../models/Movie.js';
import User from '../models/User.js';

// @desc    Get admin stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalMovies, bannedUsers] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments(),
      User.countDocuments({ isBanned: true }),
    ]);
    res.json({ totalUsers, totalMovies, bannedUsers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all movies from DB
// @route   GET /api/admin/movies
// @access  Private/Admin
const getMovies = async (req, res, next) => {
  try {
    const movies = await Movie.find({}).sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a movie
// @route   POST /api/admin/movies
// @access  Private/Admin
const addMovie = async (req, res, next) => {
  try {
    const { title, poster, description, movieId, releaseDate, trailerUrl, genre, category } = req.body;

    const movieExists = await Movie.findOne({ movieId });

    if (movieExists) {
      res.status(400);
      throw new Error('Movie with this ID already exists');
    }

    const movie = new Movie({
      title,
      poster,
      description,
      movieId,
      releaseDate,
      trailerLink: trailerUrl,
      genre: Array.isArray(genre) ? genre : genre.split(',').map((g) => g.trim()),
      category,
    });

    const createdMovie = await movie.save();
    res.status(201).json(createdMovie);
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a movie
// @route   PUT /api/admin/movies/:id
// @access  Private/Admin
const updateMovie = async (req, res, next) => {
  try {
    const { title, poster, description, releaseDate, trailerUrl, genre, category } = req.body;

    const movie = await Movie.findById(req.params.id);

    if (movie) {
      movie.title = title || movie.title;
      movie.poster = poster || movie.poster;
      movie.description = description || movie.description;
      movie.releaseDate = releaseDate || movie.releaseDate;
      movie.trailerLink = trailerUrl || movie.trailerLink;
      movie.category = category || movie.category;
      
      if (genre) {
         movie.genre = Array.isArray(genre) ? genre : genre.split(',').map((g) => g.trim());
      }
      
      const updatedMovie = await movie.save();
      res.json(updatedMovie);
    } else {
      res.status(404);
      throw new Error('Movie not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a movie
// @route   DELETE /api/admin/movies/:id
// @access  Private/Admin
const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (movie) {
      await movie.deleteOne();
      res.json({ message: 'Movie removed' });
    } else {
      res.status(404);
      throw new Error('Movie not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Ban or Unban a user
// @route   PATCH /api/admin/ban-user/:id
// @access  Private/Admin
const toggleBanUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.role === 'admin') {
        res.status(400);
        throw new Error('Cannot ban an admin user');
      }

      user.isBanned = !user.isBanned;
      const updatedUser = await user.save();
      
      res.json({
        message: user.isBanned ? 'User banned successfully' : 'User unbanned successfully',
        isBanned: updatedUser.isBanned,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

export { getStats, getMovies, addMovie, updateMovie, deleteMovie, getUsers, toggleBanUser };
