import { useState, useEffect, useCallback } from 'react'
import { UserCircle, Key, Pencil, Trash2, Plus, X } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

import { userService } from '../api/userService'
import CreateUserModal   from '../components/users/CreateUserModal'
import ResetPasswordModal from '../components/users/ResetPasswordModal'
import EditUserModal      from '../components/users/EditUserModal'

// ─── Role badge ────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const isAdmin = role === 'super-admin'
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isAdmin
          ? 'bg-[#2e7d5e] text-white'
          : 'bg-[#1a2535] text-white'
      }`}
    >
      {isAdmin ? 'Super Admin' : 'Data Entry'}
    </span>
  )
}

// ─── Setup badge ───────────────────────────────────────────────────────────
function SetupBadge({ isFirstLogin }) {
  if (!isFirstLogin) return null
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border border-orange-300 text-orange-500">
      Awaiting Setup
    </span>
  )
}

// ─── Skeleton row ──────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded animate-pulse w-48" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-72" />
      </div>
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 px-5 py-16 text-center text-slate-400">
      <UserCircle size={40} className="mx-auto mb-3 text-slate-300" />
      <p className="font-medium">No users found</p>
      <p className="text-xs mt-1">Create a user to get started</p>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────
export default function UserManagement() {
  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [createOpen,  setCreateOpen]  = useState(false)
  const [resetUser,   setResetUser]   = useState(null)
  const [editUser,    setEditUser]    = useState(null)
  const [deletingId,  setDeletingId]  = useState(null)

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await userService.getUsers()
      setUsers(res.data.users ?? res.data)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load users. Is the server running?'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await userService.deleteUser(id)
      setDeletingId(null)
      toast.success('User deleted')
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
            <p className="text-sm text-slate-400 mt-0.5">Create, edit, and manage system users.</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#e09510] hover:bg-[#c8840e] text-white text-sm font-medium rounded-lg transition-all"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <X size={15} /> {error}
          </div>
        )}

        {/* User list */}
        <div className="space-y-3">
          {loading
            ? [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
            : users.length === 0
            ? <EmptyState />
            : users.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#2e7d5e]/10 flex items-center justify-center shrink-0">
                  <UserCircle size={22} className="text-[#2e7d5e]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-700">
                      {user.fullName || user.username}
                    </p>
                    <RoleBadge role={user.role} />
                    <SetupBadge isFirstLogin={user.isFirstLogin} />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    @{user.username}
                    {user.email    && ` · ${user.email}`}
                    {user.designation && ` · ${user.designation}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Reset */}
                  <button
                    onClick={() => setResetUser(user)}
                    title="Reset Password"
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#2e7d5e] border border-slate-200 hover:border-[#2e7d5e] px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Key size={13} />
                    Reset
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => setEditUser(user)}
                    title="Edit User"
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#2e7d5e] border border-slate-200 hover:border-[#2e7d5e] px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>

                  {/* Delete */}
                  {deletingId === user._id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-xs bg-red-500 text-white px-2.5 py-1.5 rounded-lg hover:bg-red-600 transition"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg border border-slate-200 transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(user._id)}
                      title="Delete User"
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Modals */}
      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onCreated={fetchUsers}
        />
      )}

      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onReset={fetchUsers}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={fetchUsers}
        />
      )}
    </>
  )
}