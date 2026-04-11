import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  Database,
  UserCircle,
  LogOut,
} from 'lucide-react'
import idb from '../../assets/idb.png'

const navItems = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard'       },
  { to: '/applications',    icon: FileText,         label: 'Applications'    },
  { to: '/user-management', icon: Users,            label: 'User Management' },
  { to: '/reference-data',  icon: Database,         label: 'Reference Data'  },
  { to: '/my-profile',      icon: UserCircle,       label: 'My Profile'      },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    navigate('/login')
  }

  return (
    <aside className="w-64 h-screen bg-[#1a2535] flex flex-col fixed left-0 top-0 z-50">
      {/* ── Logo area ── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        {/* IDB logo image replaces the old green text box */}
        <img
          src={idb}
          alt="IDB Logo"
          className="w-10 h-10 rounded-lg object-contain shrink-0"
        />
        <div>
          <p className="text-white text-sm font-semibold leading-tight">IDB Loan System</p>
          <p className="text-slate-400 text-[10px]">Management Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#e09510] text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={17} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-white/10 pt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150"
        >
          <LogOut size={17} strokeWidth={1.8} />
          Logout
        </button>
      </div>
    </aside>
  )
}