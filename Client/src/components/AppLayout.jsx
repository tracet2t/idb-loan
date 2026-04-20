import { Outlet } from 'react-router-dom'
import Sidebar from './layout/Sidebar'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <main className="ml-64 flex-1 p-6 overflow-y-auto">
        <Outlet /> 
      </main>
    </div>
  )
}