import { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await api.get('/history');
        setHistory(res.data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userInfo, navigate]);

  const handleDelete = async (e, id) => {
    e.preventDefault(); // Link pe click na jaye
    e.stopPropagation();
    try {
      await api.delete(`/history/${id}`);
      setHistory(prev => prev.filter(item => item._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all watch history?')) return;
    try {
      await api.delete('/history');
      setHistory([]);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="h-screen flex flex-col items-center justify-center"><Loader /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold border-l-4 border-red-600 pl-2">Watch History</h2>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm text-gray-400 hover:text-red-500 transition border border-gray-700 hover:border-red-500 px-3 py-1 rounded-md"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="text-gray-400">You haven't watched any trailers or visited any movie pages yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map(item => (
            <div key={item._id} className="relative group">
              <Link
                to={`/movie/${item.movie._id}`}
                className="group bg-[#1a1a1a] p-3 rounded-lg flex items-center gap-4 hover:bg-[#252525] transition border border-transparent hover:border-white/10"
              >
                <div className="relative w-16 h-24 flex-none overflow-hidden rounded-md shadow-lg">
                  <img
                    src={item.movie?.poster?.startsWith('http') ? item.movie.poster : `https://image.tmdb.org/t/p/w200${item.movie.poster}`}
                    alt={item.movie.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => { e.target.src = 'https://placehold.co/150x225?text=No+Poster' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white group-hover:text-red-600 transition truncate">
                    {item.movie.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Watched on: {new Date(item.watchedAt).toLocaleDateString()} at {new Date(item.watchedAt).toLocaleTimeString()}
                  </p>
                  {item.movie.vote_average && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-green-500 font-bold text-[10px]">{(item.movie.vote_average * 10).toFixed(0)}% Match</span>
                    </div>
                  )}
                </div>
                <div className="text-gray-500 group-hover:text-white px-2">
                  <span className="text-xl font-bold">›</span>
                </div>
              </Link>

              {/* Delete button */}
              <button
                onClick={(e) => handleDelete(e, item._id)}
                className="absolute top-2 right-2 bg-[#1a1a1a] text-gray-500 hover:text-red-500 hover:bg-[#2a2a2a] p-1.5 rounded-md transition opacity-0 group-hover:opacity-100"
                title="Remove from history"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
