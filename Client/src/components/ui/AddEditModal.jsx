import { useState, useEffect } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'

/**
 * AddEditModal — reusable modal for adding or editing a name
 * Props:
 *   open      – bool
 *   onClose   – () => void
 *   onSubmit  – (name: string) => Promise<void>
 *   title     – string   e.g. 'Add Region'
 *   label     – string   e.g. 'Region Name'
 *   initial   – string   pre-filled value when editing
 *   loading   – bool
 */
export default function AddEditModal({
  open, onClose, onSubmit,
  title = 'Add Item',
  label = 'Name',
  initial = '',
  loading = false,
}) {
  const [name, setName] = useState(initial)
  const [error, setError] = useState('')

  // Reset when modal opens
  useEffect(() => {
    if (open) { setName(initial); setError('') }
  }, [open, initial])

  const handleSubmit = async () => {
    if (!name.trim()) { setError(`${label} is required`); return }
    await onSubmit(name.trim())
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <DialogTitle className="text-base font-semibold text-slate-800">{title}</DialogTitle>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
              <X size={16} />
            </button>
          </div>

          {/* Input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={`Enter ${label.toLowerCase()}...`}
              autoFocus
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623]
                text-slate-700 transition"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#F5A623] hover:bg-[#e09510] rounded-lg transition disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}