import { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { userService } from '../../api/userService'

const ROLES = ['Data Entry', 'Super Admin']

export default function EditUserModal({ user, onClose, onUpdated }) {
  const [form, setForm] = useState({
    fullName:      user?.profile?.fullName      || '',
    role:          user?.role === 'super-admin' ? 'Super Admin' : 'Data Entry',
    designation:   user?.profile?.designation   || '',
    qualification: user?.profile?.studies       || '',
    email:         user?.email         || '',
    phone:         user?.profile?.phone         || '',
    address:       user?.profile?.address       || '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await userService.updateUser(user._id, {
        fullName:      form.fullName,
        role:          form.role.toLowerCase().replace(' ', '-'),
        designation:   form.designation,
        qualification: form.qualification,
        email:         form.email,
        phone:         form.phone,
        address:       form.address,
      })
      toast.success('User updated successfully!')
      onUpdated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Edit User —{' '}
            <span className="text-[#2e7d5e]">{user?.username}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">Full Name</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/30 focus:border-[#2e7d5e] transition"
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/30 focus:border-[#2e7d5e] transition bg-white"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Designation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">Designation</label>
            <input
              name="designation"
              value={form.designation}
              onChange={handleChange}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/30 focus:border-[#2e7d5e] transition"
            />
          </div>

          {/* Qualification */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">Qualification</label>
            <input
              name="qualification"
              value={form.qualification}
              onChange={handleChange}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/30 focus:border-[#2e7d5e] transition"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/30 focus:border-[#2e7d5e] transition"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/30 focus:border-[#2e7d5e] transition"
            />
          </div>

          {/* Address — full width */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/30 focus:border-[#2e7d5e] transition"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm bg-[#2e7d5e] text-white rounded-lg hover:bg-[#256b50] transition disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}