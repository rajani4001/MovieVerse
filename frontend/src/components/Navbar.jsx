import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { FaSearch, FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'English', path: '/english' },
  { label: '🎬 Hindi', path: '/hindi' },
  { label: '🎭 South', path: '/south' },
];

const Navbar = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    setMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-colors duration-300 ${
        isScrolled ? 'bg-[#141414] shadow-md py-3' : 'bg-gradient-to-b from-black/80 to-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8 lg:px-12 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="text-2xl lg:text-3xl font-black text-[#E50914] tracking-tight drop-shadow-md flex-shrink-0">
          MOVIEVERSE
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-1.5 rounded text-sm font-semibold transition whitespace-nowrap ${
                isActive(link.path)
                  ? 'text-white bg-white/10'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Right - Search + User */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          <Link to="/search" className="text-gray-300 hover:text-white transition">
            <FaSearch size={20} />
          </Link>

          {userInfo ? (
            <div className="flex items-center gap-4 group relative">
              <span className="cursor-pointer flex items-center gap-2">
                <FaUserCircle size={26} className="text-gray-300 hover:text-white transition" />
              </span>
              <div className="absolute right-0 top-full mt-2 w-48 bg-black/90 rounded border border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 flex flex-col py-2 shadow-2xl">
                <div className="px-4 py-2 border-b border-gray-800 font-bold text-white text-sm">{userInfo.name}</div>
                <Link to="/profile" className="px-4 py-3 hover:bg-gray-800 transition text-sm text-gray-300 hover:text-white">My Profile</Link>
                <Link to="/favorites" className="px-4 py-3 hover:bg-gray-800 transition text-sm text-gray-300 hover:text-white">My Favorites</Link>
                <Link to="/history" className="px-4 py-3 hover:bg-gray-800 transition text-sm text-gray-300 hover:text-white">Watch History</Link>
                {userInfo.role === 'admin' && (
                  <Link to="/admin" className="px-4 py-3 hover:bg-gray-800 transition text-sm text-[#E50914] font-semibold">Admin Panel</Link>
                )}
                <button onClick={handleLogout} className="px-4 py-3 text-left hover:bg-gray-800 transition text-sm text-gray-300 hover:text-white border-t border-gray-800 mt-1">
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="bg-[#E50914] hover:bg-[#b8070f] text-white px-4 py-2 rounded font-medium transition text-sm">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#141414] border-t border-gray-800 px-4 py-3 flex flex-col gap-1">
          {/* Nav links */}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-3 rounded text-sm font-semibold transition ${
                isActive(link.path)
                  ? 'text-white bg-white/10'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <Link to="/search" className="flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded transition text-sm">
            <FaSearch size={14} /> Search
          </Link>

          <div className="border-t border-gray-800 mt-1 pt-1">
            {userInfo ? (
              <>
                <div className="px-3 py-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">{userInfo.name}</div>
                <Link to="/profile" className="block px-3 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded transition text-sm">My Profile</Link>
                <Link to="/favorites" className="block px-3 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded transition text-sm">My Favorites</Link>
                <Link to="/history" className="block px-3 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded transition text-sm">Watch History</Link>
                {userInfo.role === 'admin' && (
                  <Link to="/admin" className="block px-3 py-3 text-[#E50914] font-semibold hover:bg-white/5 rounded transition text-sm">Admin Panel</Link>
                )}
                <button onClick={handleLogout} className="w-full text-left px-3 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded transition text-sm border-t border-gray-800 mt-1">
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="block mt-1 bg-[#E50914] hover:bg-[#b8070f] text-white px-4 py-3 rounded font-medium transition text-center text-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
