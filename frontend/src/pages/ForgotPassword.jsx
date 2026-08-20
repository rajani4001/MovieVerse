import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
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

      <div className="relative z-10 max-w-[450px] w-full bg-black/75 p-16 rounded-md">
        <h2 className="text-3xl font-bold text-white mb-2">Forgot Password</h2>
        <p className="text-gray-400 text-sm mb-8">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {success ? (
          <div className="text-center">
            <div className="bg-green-600/20 border border-green-600 text-green-400 p-4 rounded mb-6 text-sm">
              Reset link sent! Check your email inbox.
            </div>
            <Link to="/login" className="text-white hover:underline text-sm">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={submitHandler} className="space-y-4">
            {error && (
              <div className="bg-[#e87c03] text-white p-3 rounded text-sm">{error}</div>
            )}
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded bg-[#333] text-white placeholder-gray-400 focus:outline-none focus:bg-[#454545] focus:ring-2 focus:ring-white transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#E50914] hover:bg-[#c11119] text-white font-bold rounded transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="text-center mt-4">
              <Link to="/login" className="text-gray-400 hover:text-white text-sm transition">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
