import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Users,
  Database,
  UserCircle,
  LogOut,
  PlusCircle,
  FileUp // Data Migration-க்காக புதிய Icon
} from 'lucide-react';
import idb from '../../assets/idb.png';

export default function Sidebar() {
  const navigate = useNavigate();
  
  const userRole = localStorage.getItem('role') || ""; 

  const navItems = [
    { to: '/dashboard',       icon: LayoutDashboard,  label: 'Dashboard',       roles: ['super-admin'] },
    
    { to: '/applications',    icon: Search,           label: 'Loan Queue',      roles: ['super-admin', 'data-entry'] },
    
    { to: '/new-loan',        icon: PlusCircle,       label: 'New Loan',        roles: [ 'data-entry'] },
    
    { to: '/migration',       icon: FileUp,           label: 'Data Migration',  roles: ['data-entry'] },
    
    { to: '/user-management', icon: Users,            label: 'User Management',  roles: ['super-admin'] },
    { to: '/reference-data',  icon: Database,         label: 'Reference Data',   roles: ['super-admin'] },
    
    { to: '/my-profile',      icon: UserCircle,       label: 'My Profile',       roles: ['super-admin', 'data-entry'] },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside className="w-64 h-screen bg-[#1a2535] flex flex-col fixed left-0 top-0 z-50 shadow-2xl">
      {/* ── Logo Area (Original Style) ── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <img src={idb} alt="IDB Logo" className="w-10 h-10 rounded-lg object-contain shrink-0" />
        <div>
          <p className="text-white text-sm font-semibold leading-tight">IDB Loan System</p>
          <p className="text-slate-400 text-[10px] uppercase tracking-wider">Management Portal</p>
        </div>
      </div>

      {/* ── Navigation (Original Orange Theme) ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => item.roles.includes(userRole))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#e09510] text-white shadow-lg' // Your original Orange Color
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={17} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          ))}
      </nav>

      {/* ── Logout (Original Style) ── */}
      <div className="px-3 pb-6 border-t border-white/10 pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150"
        >
          <LogOut size={17} strokeWidth={1.8} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}