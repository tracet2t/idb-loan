import React, { useState, useEffect, useCallback, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, User, Phone, MapPin, Briefcase, DollarSign, FileText, AlertCircle, Hash, Loader2, Upload, Trash2, Eye } from 'lucide-react'
import api from '../../api/axios'
import { loanService } from '../../api/loanService'
import toast from 'react-hot-toast'

// ─── Documents Editor ───────────────────────────────────────────────────────
function DocumentsEditor({ loanId, initialDocs, onUpdated }) {
  const [docs, setDocs]            = useState(initialDocs)
  const [pendingNew, setPending]   = useState([])
  const [removingIdx, setRemoving] = useState(null)
  const [uploading, setUploading]  = useState(false)
  const fileInputRef               = React.useRef(null)

  const handlePick = (e) => {
    const picked = Array.from(e.target.files)
    if (!picked.length) return
    setPending((prev) => [...prev, ...picked])
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!pendingNew.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      pendingNew.forEach((f) => fd.append('files', f))
      const res = await loanService.addLoanDocuments(loanId, fd)
      setDocs(res.data.attachments)
      setPending([])
      onUpdated?.(res.data)
      toast.success('Documents uploaded!')
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (idx) => {
    setRemoving(idx)
    try {
      const res = await loanService.removeLoanDocument(loanId, idx)
      setDocs(res.data.attachments)
      onUpdated?.(res.data)
      toast.success('Document removed')
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Remove failed')
    } finally {
      setRemoving(null)
    }
  }

  const handleRemovePending = (idx) => {
    setPending((prev) => prev.filter((_, i) => i !== idx))
  }

  const getExt = (name) => name?.split('.').pop().toUpperCase() ?? 'DOC'

  return (
    <div className="space-y-2">

      {docs.length === 0 && pendingNew.length === 0 && (
        <div className="text-center py-5 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs">
          No documents attached.
        </div>
      )}

      {/* Existing saved docs */}
      {docs.map((file, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-all"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-white rounded-lg shadow-sm text-[#2e7d5e]">
              <FileText size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-700 font-medium truncate">{file.name}</p>
              <p className="text-[10px] text-slate-400 uppercase">{getExt(file.name)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`http://localhost:5000/${file.path}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-[#2e7d5e] hover:bg-[#2e7d5e] hover:text-white px-3 py-1.5 rounded-lg transition border border-[#2e7d5e]/20 flex items-center gap-1"
            >
              <Eye size={12} /> View
            </a>
            <button
              onClick={() => handleRemove(idx)}
              disabled={removingIdx === idx}
              className="text-xs text-red-500 hover:bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
            >
              {removingIdx === idx
                ? <Loader2 size={12} className="animate-spin" />
                : <Trash2 size={12} />
              }
              Remove
            </button>
          </div>
        </div>
      ))}

      {/* Pending new files */}
      {pendingNew.map((file, idx) => (
        <div
          key={`pending-${idx}`}
          className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 border-dashed rounded-xl"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500">
              <FileText size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-blue-700 font-medium truncate">{file.name}</p>
              <p className="text-[10px] text-blue-400 uppercase">
                New · {getExt(file.name)} · {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>
          <button
            onClick={() => handleRemovePending(idx)}
            className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
          >
            <Trash2 size={12} /> Cancel
          </button>
        </div>
      ))}

      {/* Upload zone */}
      <div className="pt-1 space-y-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-slate-200 hover:border-[#2e7d5e] hover:bg-[#2e7d5e]/5 rounded-xl py-4 text-xs text-slate-400 hover:text-[#2e7d5e] transition flex flex-col items-center gap-1.5"
        >
          <Upload size={16} />
          Click to select files
          <span className="text-[10px] text-slate-300">PDF, PNG, JPG up to 10MB</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handlePick}
        />
        {pendingNew.length > 0 && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-2.5 bg-[#2e7d5e] hover:bg-[#256b50] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {uploading
              ? <><Loader2 size={13} className="animate-spin" /> Uploading…</>
              : <><Upload size={13} /> Upload {pendingNew.length} file{pendingNew.length > 1 ? 's' : ''}</>
            }
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Field Group ────────────────────────────────────────────────────────────
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

// ─── Main Modal ─────────────────────────────────────────────────────────────
export default function EditLoanModal({ open, loan, onClose, onSave, fetchLoans }) {
  const [form, setForm]     = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [regions, setRegions] = useState([])
  const [sectors, setSectors] = useState([])

  const fetchMetadata = useCallback(async () => {
    try {
      const [regRes, secRes] = await Promise.all([
        api.get('/loans/regions'),
        api.get('/loans/sectors'),
      ])
      if (Array.isArray(regRes.data))
        setRegions(regRes.data.map((r) => (typeof r === 'string' ? r : r.name)))
      if (Array.isArray(secRes.data))
        setSectors(secRes.data.map((s) => (typeof s === 'string' ? s : s.name)))
    } catch (err) {
      console.error('Metadata fetch error in Modal:', err)
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

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.applicantName?.trim()) e.applicantName = 'Full name is required'
    if (!form.nic?.trim())           e.nic           = 'NIC is required'
    if (!form.region)                e.region        = 'Please select a region'
    if (!form.sector)                e.sector        = 'Please select a sector'
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

        <div className="fixed inset-0 flex items-center justify-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"  leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
           {/* <Dialog.Panel className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col">
*/}
             <Dialog.Panel className="w-[90vw] h-[98vh] max-w-none rounded-2xl overflow-hidden bg-white shadow-2xl flex flex-col">
              
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
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                    <AlertCircle size={15} /> {errors.general}
                  </div>
                )}

                {/* Applicant Profile */}
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

                {/* Classification */}
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

                {/* Verification Documents */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verification Documents</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  <DocumentsEditor
                    loanId={loan?._id}
                    initialDocs={loan?.attachments ?? []}
                    onUpdated={() => fetchLoans?.()}
                  />
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
                  <input
                    type="checkbox"
                    checked={form.priority || false}
                    onChange={e => handleChange('priority', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-[#2e7d5e] focus:ring-[#2e7d5e]/30 cursor-pointer"
                  />
                </label>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 bg-[#2e7d5e] hover:bg-[#256b50] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#2e7d5e]/20 transition-all disabled:opacity-70 flex items-center gap-2">
                  {loading && <Loader2 size={16} className="animate-spin" />}
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