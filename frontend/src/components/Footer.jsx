const Footer = () => {
  return (
    <footer className="bg-black py-8 mt-12 border-t border-white/10">
      <div className="container mx-auto px-4 text-center text-gray-400">
        <p className="mb-4">
          <span className="text-netRed font-bold text-xl">MOVIEVERSE</span>
        </p>
        <p className="text-sm">
          &copy; {new Date().getFullYear()} MovieVerse Platform. All rights reserved.
        </p>
        <div className="flex justify-center gap-6 mt-6">
          <a href="#" className="hover:text-white transition">Terms of Service</a>
          <a href="#" className="hover:text-white transition">Privacy Policy</a>
          <a href="#" className="hover:text-white transition">Help Center</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
