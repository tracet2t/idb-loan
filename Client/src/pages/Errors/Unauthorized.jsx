import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center border-t-8 border-[#8B0000]">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Expired</h2>
        <p className="text-gray-500 mb-6">For security reasons, your session has timed out. Please sign in again to continue.</p>
        <button 
          onClick={() => navigate('/login')}
          className="w-full bg-[#F5A623] text-white py-3 rounded-lg font-bold hover:bg-[#e09510] transition-all shadow-md"
        >
          Sign In Again
        </button>
      </div>
    </div>
  );
}