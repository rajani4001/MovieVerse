import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    movie: {
      type: String,
      required: true,
    },
    title: { type: String },
    poster: { type: String },
    releaseDate: { type: String },
    vote_average: { type: Number },
  },
  { timestamps: true }
);

// Compound index for fast lookup + prevent duplicates
favoriteSchema.index({ user: 1, movie: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;
