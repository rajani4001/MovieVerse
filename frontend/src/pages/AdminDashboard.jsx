import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import { FaTrash, FaEdit, FaTimes, FaCheck, FaFilm, FaUsers, FaBan } from 'react-icons/fa';
import toast from 'react-hot-toast';

const emptyForm = {
  title: '', poster: '', description: '', movieId: '',
  releaseDate: '', trailerUrl: '', genre: '', category: 'movie'
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalMovies: 0, bannedUsers: 0 });

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  // Edit form
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(emptyForm);

  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [userInfo, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [moviesRes, usersRes, statsRes] = await Promise.all([
        api.get('/admin/movies'),
        api.get('/admin/users'),
        api.get('/admin/stats'),
      ]);
      setMovies(moviesRes.data);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleAddMovie = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/movies', formData);
      toast.success('Movie added successfully!');
      setShowForm(false);
      setFormData(emptyForm);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding movie');
    }
  };

  const handleEditClick = (movie) => {
    setEditingId(movie._id);
    setEditData({
      title: movie.title || '',
      poster: movie.poster || '',
      description: movie.description || '',
      movieId: movie.movieId || '',
      releaseDate: movie.releaseDate || '',
      trailerUrl: movie.trailerLink || '',
      genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || '',
      category: movie.category || 'movie',
    });
  };

  const handleEditSave = async (id) => {
    try {
      await api.put(`/admin/movies/${id}`, editData);
      toast.success('Movie updated successfully!');
      setEditingId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating movie');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditData(emptyForm);
  };

  const handleDeleteMovie = async (id) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await api.delete(`/admin/movies/${id}`);
        toast.success('Movie deleted');
        setMovies(movies.filter((m) => m._id !== id));
      } catch (error) {
        toast.error('Error deleting movie');
      }
    }
  };

  const handleToggleBan = async (id) => {
    try {
      const res = await api.patch(`/admin/ban-user/${id}`);
      toast.success(res.data.message);
      setUsers(users.map((u) => u._id === id ? { ...u, isBanned: res.data.isBanned } : u));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating user status');
    }
  };

  const inputCls = "p-3 bg-[#1a1a1a] border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-red-500 w-full";

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8 text-red-600">Admin Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-5 flex items-center gap-4">
          <div className="bg-blue-600/20 p-3 rounded-lg">
            <FaUsers size={24} className="text-blue-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-5 flex items-center gap-4">
          <div className="bg-red-600/20 p-3 rounded-lg">
            <FaFilm size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Movies in DB</p>
            <p className="text-3xl font-bold text-white">{stats.totalMovies}</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-5 flex items-center gap-4">
          <div className="bg-yellow-600/20 p-3 rounded-lg">
            <FaBan size={24} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Banned Users</p>
            <p className="text-3xl font-bold text-white">{stats.bannedUsers}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b border-gray-700 pb-2">
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'movies' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}
          onClick={() => setActiveTab('movies')}
        >
          Manage Movies
        </button>
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'users' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}
          onClick={() => setActiveTab('users')}
        >
          Manage Users
        </button>
      </div>

      {activeTab === 'movies' && (
        <div>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); }}
            className="mb-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
          >
            {showForm ? 'Cancel' : '+ Add New Movie'}
          </button>

          {/* Add Movie Form */}
          {showForm && (
            <form onSubmit={handleAddMovie} className="mb-10 p-6 bg-[#1a1a1a] border border-gray-700 rounded-xl space-y-4 max-w-2xl">
              <h3 className="text-lg font-bold text-white mb-2">Add New Movie</h3>
              <div className="grid grid-cols-2 gap-4">
                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Title" className={inputCls} />
                <input required type="number" name="movieId" value={formData.movieId} onChange={handleInputChange} placeholder="TMDB ID" className={inputCls} />
                <input type="text" name="poster" value={formData.poster} onChange={handleInputChange} placeholder="Poster URL or Path" className={inputCls} />
                <input type="text" name="releaseDate" value={formData.releaseDate} onChange={handleInputChange} placeholder="Release Date (YYYY-MM-DD)" className={inputCls} />
                <input type="text" name="trailerUrl" value={formData.trailerUrl} onChange={handleInputChange} placeholder="Trailer YouTube URL" className={inputCls} />
                <input type="text" name="genre" value={formData.genre} onChange={handleInputChange} placeholder="Genre (comma separated)" className={inputCls} />
              </div>
              <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" rows="3" className={inputCls}></textarea>
              <select name="category" value={formData.category} onChange={handleInputChange} className={inputCls}>
                <option value="movie">Movie</option>
                <option value="tv">TV Show</option>
              </select>
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition">
                Save Movie
              </button>
            </form>
          )}

          {/* Edit Movie Form */}
          {editingId && (
            <div className="mb-10 p-6 bg-[#1a1a1a] border border-yellow-600/50 rounded-xl space-y-4 max-w-2xl">
              <h3 className="text-lg font-bold text-yellow-400 mb-2">Edit Movie</h3>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" name="title" value={editData.title} onChange={handleEditInputChange} placeholder="Title" className={inputCls} />
                <input type="text" name="poster" value={editData.poster} onChange={handleEditInputChange} placeholder="Poster URL or Path" className={inputCls} />
                <input type="text" name="releaseDate" value={editData.releaseDate} onChange={handleEditInputChange} placeholder="Release Date (YYYY-MM-DD)" className={inputCls} />
                <input type="text" name="trailerUrl" value={editData.trailerUrl} onChange={handleEditInputChange} placeholder="Trailer YouTube URL" className={inputCls} />
                <input type="text" name="genre" value={editData.genre} onChange={handleEditInputChange} placeholder="Genre (comma separated)" className={inputCls} />
                <select name="category" value={editData.category} onChange={handleEditInputChange} className={inputCls}>
                  <option value="movie">Movie</option>
                  <option value="tv">TV Show</option>
                </select>
              </div>
              <textarea name="description" value={editData.description} onChange={handleEditInputChange} placeholder="Description" rows="3" className={inputCls}></textarea>
              <div className="flex gap-3">
                <button onClick={() => handleEditSave(editingId)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition">
                  <FaCheck size={12} /> Save Changes
                </button>
                <button onClick={handleEditCancel} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded transition">
                  <FaTimes size={12} /> Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/10 text-gray-300">
                  <th className="p-4 rounded-tl-lg">TMDB ID</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 rounded-tr-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-400">No movies in database yet. Add one above.</td>
                  </tr>
                ) : movies.map((movie) => (
                  <tr key={movie._id} className={`border-b border-white/5 hover:bg-white/5 transition ${editingId === movie._id ? 'bg-yellow-900/10' : ''}`}>
                    <td className="p-4 text-gray-400 text-xs">{movie.movieId}</td>
                    <td className="p-4 font-semibold">{movie.title}</td>
                    <td className="p-4 capitalize">{movie.category || 'Movie'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => editingId === movie._id ? handleEditCancel() : handleEditClick(movie)}
                          className={`transition ${editingId === movie._id ? 'text-yellow-400' : 'text-blue-400 hover:text-blue-300'}`}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteMovie(movie._id)}
                          className="text-red-500 hover:text-red-400 transition"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/10 text-gray-300">
                <th className="p-4 rounded-tl-lg">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="p-4 font-semibold">{user.name}</td>
                  <td className="p-4 text-gray-400">{user.email}</td>
                  <td className="p-4 capitalize">{user.role}</td>
                  <td className="p-4">
                    {user.isBanned
                      ? <span className="text-red-500 font-semibold">Banned</span>
                      : <span className="text-green-500 font-semibold">Active</span>}
                  </td>
                  <td className="p-4 text-right">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleBan(user._id)}
                        className={`transition px-3 py-1 rounded text-sm ${user.isBanned ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                      >
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
