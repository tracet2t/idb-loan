import { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { X, User, Phone, MapPin, Briefcase, DollarSign, FileText, AlertCircle, Hash } from 'lucide-react'

const REGIONS = [
  'Northern', 'Southern', 'Central', 'Western', 'Eastern',
  'Sabaragamuwa', 'North Central', 'North Western', 'Uva',
]
const SECTORS = [
  'Agriculture', 'Fisheries', 'SME', 'Technology',
  'Education', 'Healthcare', 'Manufacturing',
]

function FieldGroup({ icon: Icon, label, required, children }) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
        <Icon size={11} />
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = `
  w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg
  focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/30 focus:border-[#2e7d5e]
  text-slate-700 placeholder-slate-400 transition bg-white
`

export default function EditLoanModal({ open, loan, onClose, onSave }) {
  const [form, setForm]     = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && loan) {
      setForm({
        applicantName:    loan.applicantName    ?? '',
        nic:              loan.nic              ?? '',
        contactNumber:    loan.contactNumber    ?? '',
        region:           loan.region           ?? '',
        sector:           loan.sector           ?? '',
        amount:           loan.amount           ?? '',
        permanentAddress: loan.permanentAddress ?? '',
        loanPurpose:      loan.loanPurpose      ?? '',
        remarks:          loan.remarks          ?? '',
        priority:         loan.priority         ?? false,
      })
      setErrors({})
    }
  }, [open, loan])

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.applicantName?.trim()) e.applicantName = 'Full name is required'
    if (!form.nic?.trim())           e.nic           = 'NIC is required'
    if (!form.region)                e.region        = 'Please select a region'
    if (!form.sector)                e.sector        = 'Please select a sector'
    if (!form.amount || Number(form.amount) <= 0)
                                     e.amount        = 'Enter a valid amount'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await onSave(loan._id, { ...form, amount: Number(form.amount) })
      onClose()
    } catch (err) {
      setErrors({ general: err?.response?.data?.message ?? 'Save failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>

        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150"  leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        {/* Panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"  leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">

              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
                <div>
                  <Dialog.Title className="text-base font-bold text-slate-800">
                    Edit Loan Application
                  </Dialog.Title>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{loan?._id}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-6">

                {/* General error */}
                {errors.general && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                    <AlertCircle size={15} /> {errors.general}
                  </div>
                )}

                {/* Applicant Info */}
                <section>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    Applicant Information
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <FieldGroup icon={User} label="Full Name" required>
                      <input
                        type="text"
                        value={form.applicantName ?? ''}
                        onChange={set('applicantName')}
                        placeholder="e.g. Priya Wickramasinghe"
                        className={inputClass}
                      />
                      {errors.applicantName && <p className="text-xs text-red-500">{errors.applicantName}</p>}
                    </FieldGroup>

                    <FieldGroup icon={Hash} label="NIC Number" required>
                      <input
                        type="text"
                        value={form.nic ?? ''}
                        onChange={set('nic')}
                        placeholder="e.g. 199023456789"
                        className={`${inputClass} font-mono`}
                      />
                      {errors.nic && <p className="text-xs text-red-500">{errors.nic}</p>}
                    </FieldGroup>

                    <FieldGroup icon={Phone} label="Contact Number">
                      <input
                        type="tel"
                        value={form.contactNumber ?? ''}
                        onChange={set('contactNumber')}
                        placeholder="e.g. +94 77 345 6789"
                        className={inputClass}
                      />
                    </FieldGroup>

                    <FieldGroup icon={DollarSign} label="Requested Amount (LKR)" required>
                      <input
                        type="number"
                        value={form.amount ?? ''}
                        onChange={set('amount')}
                        min={1}
                        placeholder="e.g. 350000"
                        className={inputClass}
                      />
                      {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
                    </FieldGroup>

                  </div>
                </section>

                {/* Location & Sector */}
                <section>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    Location & Sector
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <FieldGroup icon={MapPin} label="Region" required>
                      <select value={form.region ?? ''} onChange={set('region')} className={inputClass}>
                        <option value="">Select Region</option>
                        {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {errors.region && <p className="text-xs text-red-500">{errors.region}</p>}
                    </FieldGroup>

                    <FieldGroup icon={Briefcase} label="Sector" required>
                      <select value={form.sector ?? ''} onChange={set('sector')} className={inputClass}>
                        <option value="">Select Sector</option>
                        {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.sector && <p className="text-xs text-red-500">{errors.sector}</p>}
                    </FieldGroup>

                    <FieldGroup icon={MapPin} label="Permanent Address">
                      <input
                        type="text"
                        value={form.permanentAddress ?? ''}
                        onChange={set('permanentAddress')}
                        placeholder="e.g. 45 Beach Rd, Galle"
                        className={inputClass}
                      />
                    </FieldGroup>

                  </div>
                </section>

                {/* Loan Details */}
                <section>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    Loan Details
                  </p>
                  <div className="space-y-4">

                    <FieldGroup icon={FileText} label="Loan Purpose / Business Details">
                      <textarea
                        value={form.loanPurpose ?? ''}
                        onChange={set('loanPurpose')}
                        placeholder="e.g. Boat engine repair"
                        rows={2}
                        className={`${inputClass} resize-none`}
                      />
                    </FieldGroup>

                    <FieldGroup icon={AlertCircle} label="Remarks">
                      <input
                        type="text"
                        value={form.remarks ?? ''}
                        onChange={set('remarks')}
                        placeholder="e.g. Documents to be verified"
                        className={inputClass}
                      />
                    </FieldGroup>

                    {/* Priority toggle */}
                    <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={form.priority ?? false}
                          onChange={set('priority')}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-[#2e7d5e] transition-colors duration-200" />
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform duration-200" />
                      </div>
                      <span className="text-sm text-slate-600 font-medium">Mark as Priority Application</span>
                    </label>

                  </div>
                </section>

              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-semibold text-white bg-[#2e7d5e] hover:bg-[#256b50] rounded-lg transition disabled:opacity-60 flex items-center gap-2"
                >
                  {loading && (
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  )}
                  {loading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>

            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}