import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from './layouts/MainLayout';
import Loader from './components/Loader';

const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const MovieDetails = lazy(() => import('./pages/MovieDetails'));
const Favorites = lazy(() => import('./pages/Favorites'));
const History = lazy(() => import('./pages/History'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));
const EnglishMovies = lazy(() => import('./pages/EnglishMovies'));
const HindiMovies = lazy(() => import('./pages/HindiMovies'));
const SouthMovies = lazy(() => import('./pages/SouthMovies'));

const PageLoader = () => (
  <div className="h-screen flex items-center justify-center bg-[#141414]">
    <Loader />
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="english" element={<EnglishMovies />} />
            <Route path="hindi" element={<HindiMovies />} />
            <Route path="south" element={<SouthMovies />} />
            <Route path="search" element={<Search />} />
            <Route path="movie/:id" element={<MovieDetails />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="history" element={<History />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
