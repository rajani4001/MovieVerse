import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-4">
      <h1 className="text-8xl font-black text-[#E50914] mb-4">404</h1>
      <h2 className="text-3xl font-bold mb-4">Lost your way?</h2>
      <p className="text-gray-400 text-center max-w-md mb-8">
        Sorry, we can't find that page. You'll find lots to explore on the home page.
      </p>
      <Link
        to="/"
        className="bg-white text-black font-bold px-8 py-3 rounded hover:bg-gray-200 transition"
      >
        MovieVerse Home
      </Link>
    </div>
  );
};

export default NotFound;
