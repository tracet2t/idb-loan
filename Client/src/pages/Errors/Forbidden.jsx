import { useNavigate } from 'react-router-dom';

export default function Forbidden() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative flex flex-col items-center">
        {/* Large background text for a modern look */}
        <span className="absolute -top-20 text-[10rem] font-black text-gray-200/50 select-none">403</span>
        
        <div className="relative z-10 bg-white p-12 rounded-2xl shadow-xl border-b-4 border-[#8B0000] max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-[#1B3A7A] mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-8">
            You do not have the required permissions to view this section of the Industrial Development Board portal.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-[#1B3A7A] text-white py-3 rounded-lg font-bold hover:bg-[#152e61] transition-all active:scale-95 shadow-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}