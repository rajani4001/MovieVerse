import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    poster: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: 'Description not available',
    },
    movieId: {
      type: Number,
      required: true,
      unique: true,
    },
    releaseDate: {
      type: String,
    },
    genre: {
      type: [String],
    },
    category: {
      type: String, // 'movie' or 'tv'
    },
    trailerLink: {
      type: String,
      default: 'Trailer not available',
    },
  },
  {
    timestamps: true,
  }
);

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;
