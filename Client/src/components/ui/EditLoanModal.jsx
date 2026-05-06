import { useState, useEffect, useCallback, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, User, Phone, MapPin, Briefcase, DollarSign, FileText, AlertCircle, Hash, Paperclip, Loader2 } from 'lucide-react'
import api from '../../api/axios' ;

// --- Sub-Component for Fields ---
function FieldGroup({ icon: Icon, label, required, children, error }) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
        <Icon size={11} />
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const inputClass = `
  w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg
  focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/30 focus:border-[#2e7d5e]
  text-slate-700 placeholder-slate-400 transition bg-white disabled:bg-slate-50
`

export default function EditLoanModal({ open, loan, onClose, onSave }) {
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  
  // Metadata states (Regions/Sectors)
  const [regions, setRegions] = useState([])
  const [sectors, setSectors] = useState([])

  // --- Metadata Fetching (Step 1: Fix Hardcoding) ---
  const fetchMetadata = useCallback(async () => {
    try {
      const [regRes, secRes] = await Promise.all([
        api.get('/loans/regions'),
        api.get('/loans/sectors')
      ])

      if (Array.isArray(regRes.data)) {
        const mappedRegions = regRes.data.map(r => typeof r === 'string' ? r : r.name)
        setRegions(mappedRegions)
      }
      
      if (Array.isArray(secRes.data)) {
        const mappedSectors = secRes.data.map(s => typeof s === 'string' ? s : s.name)
        setSectors(mappedSectors)
      }
    } catch (err) {
      console.error("Metadata fetch error in Modal:", err)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchMetadata()
      if (loan) {
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
    }
  }, [open, loan, fetchMetadata])

  // --- Handlers ---
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.applicantName?.trim()) e.applicantName = 'Full name is required'
    if (!form.nic?.trim()) e.nic = 'NIC is required'
    if (!form.region) e.region = 'Please select a region'
    if (!form.sector) e.sector = 'Please select a sector'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter a valid amount'
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
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150"  leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"  leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                <div>
                  <Dialog.Title className="text-base font-bold text-slate-800">Edit Loan Application</Dialog.Title>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-tighter">ID: {loan?._id}</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition">
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                {errors.general && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl animate-pulse">
                    <AlertCircle size={15} /> {errors.general}
                  </div>
                )}

                {/* Section: Applicant */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Applicant Profile</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  <FieldGroup icon={User} label="Full Name" required error={errors.applicantName}>
                    <input type="text" value={form.applicantName || ''} onChange={e => handleChange('applicantName', e.target.value)} className={inputClass} />
                  </FieldGroup>

                  <FieldGroup icon={Hash} label="NIC Number" required error={errors.nic}>
                    <input type="text" value={form.nic || ''} onChange={e => handleChange('nic', e.target.value)} className={`${inputClass} font-mono`} />
                  </FieldGroup>

                  <FieldGroup icon={Phone} label="Contact Number">
                    <input type="tel" value={form.contactNumber || ''} onChange={e => handleChange('contactNumber', e.target.value)} className={inputClass} />
                  </FieldGroup>

                  <FieldGroup icon={DollarSign} label="Amount (LKR)" required error={errors.amount}>
                    <input type="number" value={form.amount || ''} onChange={e => handleChange('amount', e.target.value)} className={inputClass} />
                  </FieldGroup>
                </div>

                {/* Section: Context (Using Database Data) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classification</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  <FieldGroup icon={MapPin} label="Region" required error={errors.region}>
                    <select value={form.region || ''} onChange={e => handleChange('region', e.target.value)} className={inputClass}>
                      <option value="">Select Region</option>
                      {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </FieldGroup>

                  <FieldGroup icon={Briefcase} label="Sector" required error={errors.sector}>
                    <select value={form.sector || ''} onChange={e => handleChange('sector', e.target.value)} className={inputClass}>
                      <option value="">Select Sector</option>
                      {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FieldGroup>

                  <div className="sm:col-span-2">
                    <FieldGroup icon={MapPin} label="Permanent Address">
                      <input type="text" value={form.permanentAddress || ''} onChange={e => handleChange('permanentAddress', e.target.value)} className={inputClass} />
                    </FieldGroup>
                  </div>
                </div>

                {/* Section: Documents */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verification Documents</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {loan?.attachments?.length > 0 ? (
                      loan.attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:border-[#2e7d5e]/30 transition-all">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-white rounded shadow-sm text-[#2e7d5e]"><FileText size={16} /></div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm text-slate-700 font-medium truncate">{file.name}</span>
                              <span className="text-[10px] text-slate-400 uppercase">{file.type?.split('/')[1] || 'Doc'}</span>
                            </div>
                          </div>
                          <a href={`http://localhost:5000/${file.path}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#2e7d5e] hover:bg-[#2e7d5e] hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-[#2e7d5e]/20">View</a>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs">No documents attached.</div>
                    )}
                  </div>
                </div>

                {/* Priority Toggle */}
                <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${form.priority ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-400'}`}>
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Urgent Priority</p>
                      <p className="text-[10px] text-slate-500 uppercase">Mark for immediate review</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={form.priority || false} onChange={e => handleChange('priority', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-[#2e7d5e] focus:ring-[#2e7d5e]/30 cursor-pointer" />
                </label>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition disabled:opacity-50">Cancel</button>
                <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 bg-[#2e7d5e] hover:bg-[#256b50] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#2e7d5e]/20 transition-all disabled:opacity-70 flex items-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Processing...' : 'Save Changes'}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}