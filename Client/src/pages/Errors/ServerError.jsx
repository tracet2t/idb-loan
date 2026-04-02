export default function ServerError() {
  return (
    <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-7xl mb-4 animate-pulse">🛠️</div>
      <h2 className="text-3xl font-bold text-[#8B0000] mb-2">System Error</h2>
      <p className="text-gray-700 mb-8 max-w-md">Our servers are experiencing technical difficulties. Our IT team has been notified.</p>
      <button 
        onClick={() => window.location.reload()}
        className="border-2 border-[#8B0000] text-[#8B0000] px-6 py-2 rounded-lg font-semibold hover:bg-[#8B0000] hover:text-white transition-all"
      >
        Refresh Page
      </button>
    </div>
  );
}