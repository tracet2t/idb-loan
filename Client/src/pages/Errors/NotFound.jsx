import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-9xl font-black text-gray-200 absolute select-none">404</h1>
      <div className="relative z-10">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-3xl font-bold text-[#1B3A7A] mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-sm">The resource you are looking for might have been removed or is temporarily unavailable.</p>
        <button 
          onClick={() => navigate('/login')}
          className="bg-[#1B3A7A] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#152e61] transition-transform active:scale-95 shadow-lg"
        >
          Return to Portal
        </button>
      </div>
    </div>
  );
}