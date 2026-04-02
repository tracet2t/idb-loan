export default function RateLimited() {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        {/* Animated Hourglass using Tailwind 4 animate-bounce */}
        <div className="text-7xl mb-6 animate-bounce">⏳</div>
        
        <h1 className="text-3xl font-black text-amber-900 mb-2 uppercase tracking-tight">
          Too Many Requests
        </h1>
        
        <p className="text-amber-800/80 mb-8 font-medium leading-relaxed">
          For security reasons, we've temporarily slowed down your access. Please wait a moment before trying again.
        </p>
        
        <div className="bg-amber-100 border border-amber-200 p-4 rounded-lg mb-6">
          <p className="text-xs text-amber-900 font-mono">Error Code: 429_TOO_MANY_ATTEMPTS</p>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="bg-amber-700 text-white px-10 py-3 rounded-full font-bold hover:bg-amber-800 transition-all shadow-lg active:scale-95"
        >
          Try Refreshing
        </button>
      </div>
    </div>
  );
}