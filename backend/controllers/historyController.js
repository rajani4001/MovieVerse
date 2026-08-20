import WatchHistory from '../models/WatchHistory.js';

// @desc    Get user watch history
// @route   GET /api/history
// @access  Private
const getHistory = async (req, res, next) => {
  try {
    const history = await WatchHistory.find({ user: req.user._id })
      .sort({ watchedAt: -1 });

    const transformed = history.map(item => ({
      ...item._doc,
      movie: {
        _id: item.movie,
        title: item.title,
        poster: item.poster,
        releaseDate: item.releaseDate,
        vote_average: item.vote_average
      }
    }));

    res.json(transformed);
  } catch (error) {
    next(error);
  }
};

// @desc    Add entry to watch history
// @route   POST /api/history
// @access  Private
const addHistory = async (req, res, next) => {
  try {
    const { movieId, title, poster, releaseDate, vote_average } = req.body;

    await WatchHistory.findOneAndDelete({ user: req.user._id, movie: movieId });

    const historyEntry = await WatchHistory.create({
      user: req.user._id,
      movie: movieId,
      title,
      poster,
      releaseDate,
      vote_average,
      watchedAt: Date.now(),
    });

    res.status(201).json(historyEntry);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a single history entry
// @route   DELETE /api/history/:id
// @access  Private
const deleteHistory = async (req, res, next) => {
  try {
    const entry = await WatchHistory.findOne({ _id: req.params.id, user: req.user._id });

    if (!entry) {
      res.status(404);
      throw new Error('History entry not found');
    }

    await entry.deleteOne();
    res.json({ message: 'History entry removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all watch history
// @route   DELETE /api/history
// @access  Private
const clearHistory = async (req, res, next) => {
  try {
    await WatchHistory.deleteMany({ user: req.user._id });
    res.json({ message: 'Watch history cleared' });
  } catch (error) {
    next(error);
  }
};

export { getHistory, addHistory, deleteHistory, clearHistory };
