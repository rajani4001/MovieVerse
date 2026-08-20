import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTrending, setPopular } from '../redux/slices/movieSlice';
import api from '../services/api';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import YouTube from 'react-youtube';
import InfiniteScroll from 'react-infinite-scroll-component';
import { FaPlay, FaInfoCircle, FaStar } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// Horizontal scroll row
const Section = ({ title, badge, badgeColor, movies, cardProps }) => {
  if (!movies || movies.length === 0) return null;
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4 px-1">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{title}</h2>
        {badge && (
          <span className={`${badgeColor} text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap`}>
            {badge}
          </span>
        )}
      </div>
      <div className="flex overflow-x-auto gap-3 md:gap-4 pb-4 scrollbar-hide">
        {movies.map((movie, index) => (
          <div key={`${movie._id}-${index}`} className="w-28 sm:w-36 md:w-44 lg:w-52 flex-none">
            <MovieCard movie={movie} {...cardProps} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Home = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);

  // Trending 4 sections
  const [trendingWeek, setTrendingWeek]     = useState([]);
  const [trendingTop, setTrendingTop]       = useState([]);
  const [trendingNow, setTrendingNow]       = useState([]);
  const [trendingUpcoming, setTrendingUpcoming] = useState([]);

  // Hindi sections
  const [hindiFeatured, setHindiFeatured]   = useState([]);
  const [hindiNowPlaying, setHindiNowPlaying] = useState([]);
  const [hindiUpcoming, setHindiUpcoming]   = useState([]);

  // South sections
  const [southRecent, setSouthRecent]       = useState([]);
  const [southClassic, setSouthClassic]     = useState([]);

  // Infinite scroll
  const [infiniteMovies, setInfiniteMovies] = useState([]);
  const [moviesPage, setMoviesPage]         = useState(1);
  const [hasMore, setHasMore]               = useState(true);

  // Modal
  const [modalOpen, setModalOpen]     = useState(false);
  const [currentTrailer, setCurrentTrailer] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [trendRes, popularRes, hindiRes, hindiFeatRes, southRes] = await Promise.allSettled([
          api.get('/movies/trending'),
          api.get('/movies/popular'),
          api.get('/movies/hindi'),
          api.get('/movies/hindi-featured'),
          api.get('/movies/south'),
        ]);

        if (trendRes.status === 'fulfilled') {
          const t = trendRes.value.data;
          setTrendingWeek(t.thisWeek || []);
          setTrendingTop(t.topRated || []);
          setTrendingNow(t.nowPlaying || []);
          setTrendingUpcoming(t.upcoming || []);
          dispatch(setTrending(t.thisWeek || []));
        }
        if (popularRes.status === 'fulfilled') {
          dispatch(setPopular(popularRes.value.data));
          setInfiniteMovies(popularRes.value.data);
        }
        if (hindiRes.status === 'fulfilled') {
          setHindiNowPlaying(hindiRes.value.data.nowPlaying || []);
          setHindiUpcoming(hindiRes.value.data.upcoming || []);
        }
        if (hindiFeatRes.status === 'fulfilled') {
          setHindiFeatured(hindiFeatRes.value.data || []);
        }
        if (southRes.status === 'fulfilled') {
          setSouthRecent(southRes.value.data.recent || []);
          setSouthClassic(southRes.value.data.classic || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [dispatch]);

  const fetchMoreData = async () => {
    try {
      const nextPage = moviesPage + 1;
      const res = await api.get('/movies/popular', { params: { page: nextPage } });
      if (res.data && res.data.length > 0) {
        setInfiniteMovies(prev => [...prev, ...res.data]);
        setMoviesPage(nextPage);
        if (nextPage >= 10) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      setHasMore(false);
    }
  };

  const playTrailer = async (movie) => {
    let active = movie;
    if (!movie.trailerLink) {
      try {
        const res = await api.get(`/movies/${movie._id || movie.id}`);
        active = res.data;
      } catch (e) { console.error(e); }
    }
    let ytId = '';
    if (active.trailerLink?.includes('v=')) {
      ytId = active.trailerLink.split('v=')[1].split('&')[0];
    }
    if (userInfo) {
      api.post('/history', {
        movieId: active._id, title: active.title, poster: active.poster,
        releaseDate: active.releaseDate, vote_average: active.vote_average,
      }).catch(() => {});
    }
    setCurrentTrailer(ytId);
    setModalOpen(true);
  };

  const addFavorite = async (movie) => {
    if (!userInfo) return toast.error('Please login to add favorites');
    try {
      await api.post('/favorites', {
        movieId: movie._id, title: movie.title, poster: movie.poster,
        releaseDate: movie.releaseDate, vote_average: movie.vote_average,
      });
      toast.success('Added to favorites!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add favorite');
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#141414]">
      <Loader />
    </div>
  );

  const cardProps = { onPlayTrailer: playTrailer, onAddFavorite: addFavorite };
  const heroMovie = trendingWeek[0];

  return (
    <div className="pb-12 bg-[#141414]">

      {/* ── HERO ── */}
      {heroMovie && (
        <div className="relative w-full text-white overflow-hidden">
          <div className="relative w-full h-[55vh] sm:h-[65vh] md:h-[75vh]">
          <img
            src={`https://image.tmdb.org/t/p/w1280${heroMovie.backdrop_path || heroMovie.backdrop || heroMovie.poster}`}
            alt={heroMovie.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />

          <div className="absolute bottom-6 sm:bottom-8 left-4 sm:left-8 md:left-12 lg:left-16 w-[90%] sm:w-[70%] md:w-[55%] lg:w-[45%]">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-2 sm:mb-3 leading-tight drop-shadow-xl"
            >
              {heroMovie.title}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="flex items-center gap-3 mb-2 sm:mb-3 text-xs sm:text-sm"
            >
              <span className="text-green-400 font-bold">{((heroMovie.vote_average || 0) * 10).toFixed(0)}% Match</span>
              <span className="text-gray-300">{heroMovie.releaseDate?.split('-')[0]}</span>
              <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                <FaStar size={11} /> {(heroMovie.vote_average || 0).toFixed(1)}
              </span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="hidden sm:block text-gray-300 text-sm md:text-base mb-4 md:mb-6 line-clamp-2 md:line-clamp-3"
            >
              {heroMovie.overview}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="flex gap-3"
            >
              <button
                onClick={() => playTrailer(heroMovie)}
                className="flex items-center gap-2 bg-white text-black font-bold px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 rounded text-sm sm:text-base hover:bg-gray-200 transition active:scale-95"
              >
                <FaPlay size={14} /> Play
              </button>
              <Link
                to={`/movie/${heroMovie._id || heroMovie.id}`}
                className="flex items-center gap-2 bg-gray-500/70 text-white font-bold px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 rounded text-sm sm:text-base hover:bg-gray-500 transition active:scale-95"
              >
                <FaInfoCircle size={14} /> More Info
              </Link>
            </motion.div>
          </div>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      <div className="px-3 sm:px-6 md:px-10 lg:px-16 mt-6 sm:mt-8">

        {/* Trending This Week */}
        <Section
          title="Trending This Week"
          badge="🔥 HOT"
          badgeColor="bg-red-600 text-white"
          movies={trendingWeek.slice(1, 21)}
          cardProps={cardProps}
        />

        {/* Top Rated */}
        <Section
          title="Top Rated Movies"
          badge="⭐ TOP RATED"
          badgeColor="bg-yellow-500 text-black"
          movies={trendingTop.slice(0, 20)}
          cardProps={cardProps}
        />

        {/* Now Playing */}
        <Section
          title="Now Playing in Cinemas"
          badge="🎬 NOW PLAYING"
          badgeColor="bg-green-600 text-white"
          movies={trendingNow.slice(0, 20)}
          cardProps={cardProps}
        />

        {/* Upcoming */}
        <Section
          title="Coming Soon"
          badge="🔜 UPCOMING"
          badgeColor="bg-blue-600 text-white"
          movies={trendingUpcoming.slice(0, 20)}
          cardProps={cardProps}
        />

        {/* Hindi Featured */}
        {hindiFeatured.length > 0 && (
          <Section
            title="🎥 Hindi — Must Watch"
            badge="BOLLYWOOD"
            badgeColor="bg-[#E50914] text-white"
            movies={hindiFeatured}
            cardProps={cardProps}
          />
        )}

        {/* Hindi Now Playing */}
        {hindiNowPlaying.length > 0 && (
          <Section
            title="🎬 Hindi — Ab Cinemas Mein"
            badge="NOW PLAYING"
            badgeColor="bg-orange-500 text-white"
            movies={hindiNowPlaying}
            cardProps={cardProps}
          />
        )}

        {/* Hindi Upcoming */}
        {hindiUpcoming.length > 0 && (
          <Section
            title="🔜 Hindi — Jald Aane Wali"
            badge="UPCOMING"
            badgeColor="bg-yellow-500 text-black"
            movies={hindiUpcoming}
            cardProps={cardProps}
          />
        )}

        {/* South Recent */}
        {southRecent.length > 0 && (
          <Section
            title="🎭 New South Movies"
            badge="LATEST"
            badgeColor="bg-purple-600 text-white"
            movies={southRecent}
            cardProps={cardProps}
          />
        )}

        {/* South Classic */}
        {southClassic.length > 0 && (
          <Section
            title="🏆 South Blockbusters"
            badge="ALL TIME HITS"
            badgeColor="bg-red-800 text-white"
            movies={southClassic}
            cardProps={cardProps}
          />
        )}

        {/* Infinite Scroll */}
        <div className="mt-2 mb-4 px-1">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4">Discover Popular</h2>
        </div>
        <InfiniteScroll
          dataLength={infiniteMovies.length}
          next={fetchMoreData}
          hasMore={hasMore}
          loader={<Loader />}
          endMessage={<p className="text-center text-gray-500 py-8 text-sm">You've seen it all!</p>}
          className="overflow-visible"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 pb-10">
            {infiniteMovies.map((movie, index) => (
              <MovieCard key={`pop-${movie._id}-${index}`} movie={movie} {...cardProps} />
            ))}
          </div>
        </InfiniteScroll>
      </div>

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

export default Home;
