import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import YouTube from 'react-youtube';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { FaSearch, FaTimes, FaPlay, FaHeart, FaStar } from 'react-icons/fa';

const Search = () => {
  const [searchTerm, setSearchTerm]     = useState('');
  const [results, setResults]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [modalOpen, setModalOpen]       = useState(false);
  const [currentTrailer, setCurrentTrailer] = useState('');
  const debounceRef = useRef(null);

  const { userInfo } = useSelector((state) => state.auth);

  // Debounced search — fires 400ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/movies/search', { params: { query: trimmed } });
        setResults(res.data || []);
      } catch (error) {
        console.error(error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

  const playTrailer = async (movie) => {
    let active = movie;
    if (!movie.trailerLink) {
      try {
        const res = await api.get(`/movies/${movie.id || movie._id}`);
        active = res.data;
      } catch (e) { console.error(e); }
    }
    let ytId = '';
    if (active.trailerLink?.includes('v=')) {
      ytId = active.trailerLink.split('v=')[1].split('&')[0];
    }
    if (userInfo) {
      api.post('/history', {
        movieId: active._id || active.id,
        title: active.title,
        poster: active.poster || active.poster_path,
        releaseDate: active.releaseDate,
        vote_average: active.vote_average,
      }).catch(() => {});
    }
    setCurrentTrailer(ytId);
    setModalOpen(true);
  };

  const addFavorite = async (movie) => {
    if (!userInfo) return toast.error('Please login to add favorites');
    try {
      await api.post('/favorites', {
        movieId: movie.id || movie._id,
        title: movie.title,
        poster: movie.poster || movie.poster_path,
        releaseDate: movie.releaseDate,
        vote_average: movie.vote_average,
      });
      toast.success('Added to favorites!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error adding favorite');
    }
  };

  const getPoster = (p) => {
    if (!p) return 'https://placehold.co/500x750?text=No+Poster';
    if (p.startsWith('http')) return p;
    return `https://image.tmdb.org/t/p/w500${p}`;
  };

  return (
    <div className="min-h-screen bg-[#141414] pt-24 pb-12 px-3 sm:px-6 md:px-10 lg:px-16">

      {/* Search Input */}
      <div className="max-w-2xl mx-auto mb-8 relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search movies, TV shows, actors..."
          className="w-full bg-zinc-900 border border-white/20 rounded-full pl-11 pr-11 py-3.5 text-white text-sm sm:text-base focus:outline-none focus:border-[#E50914] transition"
          autoFocus
        />
        {searchTerm && (
          <button
            onClick={() => { setSearchTerm(''); setResults([]); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
          >
            <FaTimes size={16} />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center mt-10">
          <Loader />
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <>
          <p className="text-gray-400 text-sm mb-4">
            {results.length} results for "<span className="text-white font-semibold">{searchTerm.trim()}</span>"
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
            {results.map((movie) => {
              const poster = getPoster(movie.poster || movie.poster_path);
              const year   = movie.releaseDate?.split('-')[0] || '';
              return (
                <div key={movie._id || movie.id} className="flex flex-col">
                  <div className="relative group aspect-[2/3] w-full rounded-md overflow-hidden bg-zinc-900 shadow-lg">
                    <Link to={`/movie/${movie._id || movie.id}`}>
                      <img
                        src={poster}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => { e.target.src = 'https://placehold.co/500x750?text=No+Poster'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); playTrailer(movie); }}
                            className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-200 text-black rounded-full shadow transition active:scale-90"
                            title="Play Trailer"
                          >
                            <FaPlay size={10} className="ml-0.5" />
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addFavorite(movie); }}
                            className="w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-red-600 text-white rounded-full border border-gray-500 transition active:scale-90"
                            title="Add to Favorites"
                          >
                            <FaHeart size={11} />
                          </button>
                        </div>
                      </div>
                    </Link>
                  </div>
                  {/* Title always visible */}
                  <div className="mt-1.5 px-0.5">
                    <p className="text-white text-xs sm:text-sm font-semibold leading-snug line-clamp-2">{movie.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <FaStar className="text-yellow-400 flex-shrink-0" size={9} />
                      <span className="text-gray-400 text-[10px] sm:text-xs">{(movie.vote_average || 0).toFixed(1)}</span>
                      {year && <span className="text-gray-500 text-[10px] sm:text-xs">• {year}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* No results */}
      {!loading && searchTerm.trim() && results.length === 0 && (
        <div className="text-center mt-20">
          <p className="text-gray-400 text-lg">No results found for "<span className="text-white">{searchTerm.trim()}</span>"</p>
          <p className="text-gray-600 text-sm mt-2">Try a different spelling or keyword</p>
        </div>
      )}

      {/* Empty state */}
      {!searchTerm && (
        <div className="text-center mt-20">
          <FaSearch className="mx-auto text-gray-700 mb-4" size={48} />
          <p className="text-gray-500 text-base">Search for movies, shows, actors...</p>
        </div>
      )}

      {/* Trailer Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        {currentTrailer ? (
          <YouTube
            videoId={currentTrailer}
            className="w-full"
            opts={{ width: '100%', height: '460', playerVars: { autoplay: 1 } }}
          />
        ) : (
          <div className="p-10 text-center">
            <h3 className="text-xl text-white">Trailer not available for this movie.</h3>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Search;
