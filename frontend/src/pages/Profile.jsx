import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../redux/slices/authSlice';
import api from '../services/api';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { FaUserCircle } from 'react-icons/fa';

const Profile = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setName(res.data.name);
        setEmail(res.data.email);
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userInfo, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (newPassword && newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }

    setSaving(true);
    try {
      const payload = { name };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await api.put('/auth/profile', payload);

      // Update redux + localStorage with new name
      dispatch(setCredentials({ ...userInfo, name: res.data.name }));

      toast.success('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader /></div>;

  return (
    <div className="min-h-screen bg-[#141414] pt-28 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-[#E50914]/20 p-4 rounded-full">
            <FaUserCircle size={40} className="text-[#E50914]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{name}</h1>
            <p className="text-gray-400 text-sm">{email}</p>
            {userInfo?.role === 'admin' && (
              <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded mt-1 inline-block">Admin</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-gray-700 pb-3">Account Info</h2>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded bg-[#252525] text-white border border-gray-600 focus:outline-none focus:border-[#E50914] transition"
                required
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 rounded bg-[#1a1a1a] text-gray-500 border border-gray-700 cursor-not-allowed"
              />
              <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-gray-700 pb-3">Change Password</h2>
            <p className="text-gray-500 text-sm">Leave blank if you don't want to change your password.</p>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-3 rounded bg-[#252525] text-white border border-gray-600 focus:outline-none focus:border-[#E50914] transition"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-4 py-3 rounded bg-[#252525] text-white border border-gray-600 focus:outline-none focus:border-[#E50914] transition"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-4 py-3 rounded bg-[#252525] text-white border border-gray-600 focus:outline-none focus:border-[#E50914] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#E50914] hover:bg-[#c11119] text-white font-bold py-4 rounded transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
