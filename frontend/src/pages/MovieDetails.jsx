import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import YouTube from 'react-youtube';
import { motion } from 'framer-motion';
import { FaPlay, FaArrowLeft, FaHeart } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const MovieDetails = () => {
  const { id } = useParams();
  const { userInfo } = useSelector((state) => state.auth);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [trailerId, setTrailerId] = useState('');

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const res = await api.get(`/movies/${id}`);
        setMovie(res.data);
        
        if (res.data.trailerLink && res.data.trailerLink.includes('v=')) {
          setTrailerId(res.data.trailerLink.split('v=')[1].split('&')[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchMovieDetails();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader /></div>;
  if (!movie) return <div className="h-screen flex items-center justify-center text-white bg-black">Movie not found</div>;

  const getPoster = (posterPath) => {
    if (!posterPath) return 'https://placehold.co/500x750?text=No+Poster';
    if (posterPath.startsWith('http')) return posterPath;
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  const getBackdrop = () => {
    if (!movie.backdrop_path && !movie.backdrop && !movie.poster) return null;
    return `https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.backdrop || movie.poster}`;
  };

  return (
    <div className="relative min-h-screen bg-[#141414] text-white">
      {/* Background Hero Image Setup */}
      {getBackdrop() && (
        <div className="absolute top-0 left-0 w-full h-[80vh] z-0">
          <img 
            src={getBackdrop()} 
            alt={movie.title} 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
        </div>
      )}

      {/* Back Button */}
      <Link to="/" className="absolute top-24 left-8 z-20 text-gray-300 hover:text-white flex items-center gap-2 transition font-medium">
        <FaArrowLeft /> Back to Browse
      </Link>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-12 lg:px-16 pt-[20vh] pb-20">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start">
          
          {/* Poster */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full md:w-1/3 lg:w-1/4 max-w-sm shrink-0"
          >
            <img 
              src={getPoster(movie.poster)} 
              alt={movie.title} 
              className="w-full rounded shadow-2xl shadow-black border border-gray-800" 
            />
          </motion.div>
          
          {/* Details */}
          <div className="flex-1 flex flex-col justify-center pt-4 md:pt-10">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-7xl font-bold mb-4 drop-shadow-xl"
            >
              {movie.title}
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex items-center gap-4 text-gray-300 mb-8 text-sm md:text-base font-semibold"
            >
              <span className="text-green-500 font-bold">{(movie.vote_average * 10 || 0).toFixed(0)}% Match</span>
              <span>{movie.releaseDate?.split('-')[0]}</span>
              {movie.genre && <span className="border border-gray-600 px-2 py-0.5 rounded text-xs">{movie.genre[0]}</span>}
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-gray-200 mb-10 leading-relaxed max-w-3xl text-lg md:text-xl drop-shadow-md"
            >
              {movie.description || movie.overview}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex gap-4"
            >
              <button
                onClick={() => {
                  setModalOpen(true);
                  if (userInfo) {
                    api.post('/history', {
                      movieId: movie._id || movie.id,
                      title: movie.title,
                      poster: movie.poster || movie.poster_path,
                      releaseDate: movie.releaseDate,
                      vote_average: movie.vote_average
                    }).catch(console.error);
                  }
                }}
                className="bg-white text-black hover:bg-gray-200 font-bold py-3 px-8 md:px-12 rounded flex items-center gap-3 transition"
              >
                <FaPlay size={20} /> Play Trailer
              </button>
              
              <button
                onClick={async () => {
                  if (!userInfo) return toast.error('Please login to add favorites');
                  try {
                    await api.post('/favorites', {
                      movieId: movie._id || movie.id,
                      title: movie.title,
                      poster: movie.poster || movie.poster_path,
                      releaseDate: movie.releaseDate,
                      vote_average: movie.vote_average
                    });
                    toast.success('Added to favorites!');
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to add favorite');
                  }
                }}
                className="bg-gray-500/70 text-white hover:bg-gray-500/90 font-bold py-3 px-8 rounded flex items-center gap-3 transition"
              >
                <FaHeart size={20} /> Add to Favorites
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        {trailerId ? (
          <YouTube 
            videoId={trailerId} 
            opts={{ width: '100%', height: '500', playerVars: { autoplay: 1 } }} 
          />
        ) : (
          <div className="p-10 text-center bg-zinc-900 rounded-md">
            <h3 className="text-xl text-white">Trailer for this movie is currently unavailable.</h3>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MovieDetails;
