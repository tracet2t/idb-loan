import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { AlertTriangle } from 'lucide-react'

/**
 * ConfirmDialog — reusable confirmation popup
 * Props:
 *   open      – bool
 *   onClose   – () => void
 *   onConfirm – () => void
 *   title     – string
 *   message   – string
 *   confirmLabel – string  (default: 'Confirm')
 *   danger    – bool       (red confirm button)
 */
export default function ConfirmDialog({
  open, onClose, onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  danger = false,
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
              <AlertTriangle size={18} className={danger ? 'text-red-600' : 'text-amber-600'} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-800">{title}</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">{message}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(); onClose() }}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition ${
                danger
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#F5A623] hover:bg-[#e09510]'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}