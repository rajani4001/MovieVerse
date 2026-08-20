import { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import YouTube from 'react-youtube';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { FaPlay, FaHeart, FaStar } from 'react-icons/fa';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTrailer, setCurrentTrailer] = useState('');
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    const fetchFavorites = async () => {
      try {
        const res = await api.get('/favorites');
        setFavorites(res.data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [userInfo, navigate]);

  const removeFavorite = async (e, movieId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`/favorites/${movieId}`);
      setFavorites(prev => prev.filter(f => f.movie._id !== movieId));
    } catch (error) {
      console.error(error);
    }
  };

  const playTrailer = async (e, movie) => {
    e.preventDefault();
    e.stopPropagation();
    let activeMovie = movie;
    if (!movie.trailerLink) {
      try {
        const res = await api.get(`/movies/${movie._id || movie.id}`);
        activeMovie = res.data;
      } catch (error) {
        console.error('Failed to fetch movie details for trailer', error);
      }
    }
    let ytId = '';
    if (activeMovie.trailerLink && activeMovie.trailerLink.includes('v=')) {
      ytId = activeMovie.trailerLink.split('v=')[1].split('&')[0];
    }
    setCurrentTrailer(ytId);
    setModalOpen(true);
  };

  const getPoster = (posterPath) => {
    if (!posterPath) return 'https://placehold.co/500x750?text=No+Poster';
    if (posterPath.startsWith('http')) return posterPath;
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 border-l-4 border-red-600 pl-2">My Favorites</h2>

      {favorites.length === 0 ? (
        <p className="text-gray-400">You haven't saved any movies to your favorites yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {favorites.map(fav => (
            <div key={fav._id} className="flex flex-col relative group">
              <Link
                to={`/movie/${fav.movie._id}`}
                className="block relative aspect-[2/3] w-full rounded-md overflow-hidden bg-zinc-900 shadow-lg"
              >
                <img
                  src={getPoster(fav.movie.poster)}
                  alt={fav.movie.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => { e.target.src = 'https://placehold.co/500x750?text=No+Poster'; }}
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => playTrailer(e, fav.movie)}
                      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-200 text-black rounded-full shadow-lg transition active:scale-90"
                      title="Play Trailer"
                    >
                      <FaPlay size={10} className="ml-0.5" />
                    </button>
                  </div>
                </div>
              </Link>

              {/* Remove from favorites button */}
              <button
                onClick={(e) => removeFavorite(e, fav.movie._id)}
                className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-red-400 hover:text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
                title="Remove from favorites"
              >
                <FaHeart size={14} />
              </button>

              {/* Title always visible below */}
              <div className="mt-1.5 px-0.5">
                <p className="text-white text-xs sm:text-sm font-semibold leading-snug line-clamp-2">{fav.movie.title}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <FaStar className="text-yellow-400 flex-shrink-0" size={9} />
                  <span className="text-gray-400 text-[10px] sm:text-xs">{(fav.movie.vote_average || 0).toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        {currentTrailer ? (
          <YouTube videoId={currentTrailer} opts={{ width: '100%', height: '500', playerVars: { autoplay: 1 } }} />
        ) : (
          <div className="p-10 text-center bg-zinc-900 rounded">
            <h3 className="text-xl text-white">Trailer is currently unavailable.</h3>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Favorites;
