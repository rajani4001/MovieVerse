const Loader = () => {
  return (
    <div className="flex justify-center items-center py-10 w-full space-x-2">
      <div className="w-4 h-4 rounded-full bg-netRed animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-4 h-4 rounded-full bg-netRed animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-4 h-4 rounded-full bg-netRed animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};

export default Loader;
