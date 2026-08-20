import { Link } from 'react-router-dom';
import { FaPlay, FaHeart, FaStar } from 'react-icons/fa';
import { motion } from 'framer-motion';

const MovieCard = ({ movie, onPlayTrailer, onAddFavorite }) => {
  const getYear = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.split('-')[0];
  };

  const getPoster = (posterPath) => {
    if (!posterPath) return 'https://placehold.co/500x750?text=No+Poster';
    if (posterPath.startsWith('http')) return posterPath;
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  return (
    <div className="flex flex-col w-full">
      {/* Card with hover effect */}
      <motion.div
        whileHover={{ scale: 1.05, zIndex: 50 }}
        transition={{ duration: 0.25 }}
        className="relative group cursor-pointer aspect-[2/3] w-full rounded-md overflow-hidden bg-zinc-900 shadow-lg"
      >
        <Link to={`/movie/${movie._id || movie.id}`} className="block w-full h-full">
          <img
            src={getPoster(movie.poster || movie.poster_path)}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { e.target.src = 'https://placehold.co/500x750?text=No+Poster'; }}
          />

          {/* Hover overlay — only action buttons, no text overlap */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5 sm:p-3">
            {/* Rating badge */}
            <div className="flex items-center gap-1 mb-2">
              <FaStar className="text-yellow-400" size={10} />
              <span className="text-white text-xs font-bold">{(movie.vote_average || 0).toFixed(1)}</span>
              {getYear(movie.releaseDate) && (
                <span className="text-gray-400 text-xs ml-1">{getYear(movie.releaseDate)}</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPlayTrailer(movie);
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white hover:bg-gray-200 text-black rounded-full shadow-lg transition active:scale-90"
                title="Play Trailer"
              >
                <FaPlay size={10} className="ml-0.5" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddFavorite(movie);
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-black/60 hover:bg-red-600 text-white rounded-full transition border border-gray-500 active:scale-90"
                title="Add to Favorites"
              >
                <FaHeart size={11} />
              </button>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Title always visible below poster — same on all pages */}
      <div className="mt-1.5 px-0.5">
        <p className="text-white text-xs sm:text-sm font-semibold leading-snug line-clamp-2">
          {movie.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <FaStar className="text-yellow-400 flex-shrink-0" size={9} />
          <span className="text-gray-400 text-[10px] sm:text-xs">{(movie.vote_average || 0).toFixed(1)}</span>
          {getYear(movie.releaseDate) && (
            <span className="text-gray-500 text-[10px] sm:text-xs">• {getYear(movie.releaseDate)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
