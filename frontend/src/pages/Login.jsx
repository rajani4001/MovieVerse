import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../redux/slices/authSlice';
import api from '../services/api';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) navigate('/');
  }, [userInfo, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      dispatch(setCredentials({ ...res.data }));
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 bg-black">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: "url('https://assets.nflxext.com/ffe/siteui/vlv3/f85718e8-fc6d-4954-bca0-f5faaf788fd9/db645733-4f10-48e0-ae30-9bb6da0d85ab/US-en-20231016-popsignuptwoweeks-perspective_alpha_website_large.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/60 z-0" />

      <div className="relative z-10 max-w-[450px] w-full bg-black/75 px-10 py-10 rounded-md">
        <h2 className="text-3xl font-bold text-white mb-6">Sign In</h2>

        <form className="space-y-4" onSubmit={submitHandler}>

          {/* Error */}
          {error && (
            <div className="bg-[#e87c03] text-white p-3 rounded text-sm">{error}</div>
          )}

          {/* Email */}
          <input
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 rounded bg-[#333] text-white placeholder-gray-400 focus:outline-none focus:bg-[#454545] transition"
          />

          {/* Password with show/hide */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 pr-12 rounded bg-[#333] text-white placeholder-gray-400 focus:outline-none focus:bg-[#454545] transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#E50914] hover:bg-[#c11119] text-white font-bold rounded transition mt-2 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Forgot password */}
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-white transition">
              Forgot password?
            </Link>
          </div>
        </form>

        <div className="mt-8 text-gray-400 text-sm">
          New to MovieVerse?{' '}
          <Link to="/signup" className="text-white hover:underline font-medium">
            Sign up now.
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
