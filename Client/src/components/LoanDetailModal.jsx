import { X, User, MapPin, Briefcase, Calendar, DollarSign, FileText, AlertCircle, Paperclip } from 'lucide-react'

function DetailRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-sm text-slate-700 font-semibold mt-0.5 ${mono ? 'font-mono' : ''}`}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

const STATUS_STYLES = {
  Approved: 'bg-[#2e7d5e]/10 text-[#2e7d5e] border border-[#2e7d5e]/30',
  Pending:  'bg-amber-50 text-amber-700 border border-amber-200'}

export default function LoanDetailModal({ loan, onClose}) {
  if (!loan) return null

  const appliedDate = loan.appliedDate
    ? new Date(loan.appliedDate).toLocaleDateString('en-LK', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—'

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Card */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Loan Application Detail</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{loan._id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Status banner */}
        <div className="px-6 pt-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_STYLES[loan.status] || ''}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${loan.status === 'Approved' ? 'bg-[#2e7d5e]' : loan.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'}`} />
            {loan.status}
            {loan.priority && (
              <span className="ml-1 bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                PRIORITY
              </span>
            )}
          </span>
        </div>

        {/* Details grid */}
        <div className="px-6 py-5 grid grid-cols-2 gap-5">
          <DetailRow icon={User}       label="Applicant Name" value={loan.applicantName} />
          <DetailRow icon={FileText}   label="NIC"            value={loan.nic}           mono />
          <DetailRow icon={MapPin}     label="Region"         value={loan.region} />
          <DetailRow icon={Briefcase}  label="Sector"         value={loan.sector} />
          <DetailRow icon={DollarSign} label="Loan Amount"    value={`LKR ${Number(loan.amount).toLocaleString('en-LK')}`} />
          <DetailRow icon={Calendar}   label="Applied Date"   value={appliedDate} />
        </div>

        {/* Attachments Section - ✅ இங்கே அட்டாச்மென்ட்கள் காட்டப்படும் */}
          <div className="px-6 pb-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3 flex items-center gap-2">
              <Paperclip size={13} /> Attachments
            </p>
            <div className="space-y-2">
              {loan.attachments && loan.attachments.length > 0 ? (
                loan.attachments.map((file, idx) => (
                  <a 
                    key={idx}
                    href={`http://localhost:5000/${file.path}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText size={18} className="text-slate-400 group-hover:text-emerald-600" />
                      <span className="text-sm text-slate-600 truncate group-hover:text-emerald-700 font-medium">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded">VIEW</span>
                  </a>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic">No documents attached.</p>
              )}
            </div>
          </div>

        {/* Remarks */}
        {loan.remarks && (
          <div className="px-6 pb-4">
            <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
              <AlertCircle size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Remarks</p>
                <p className="text-sm text-slate-600">{loan.remarks}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            Close
          </button>

          {/* {loan.status === 'Pending' && (
            <button
              onClick={() => onApprove(loan._id)}
              className="px-5 py-2 text-sm font-semibold bg-[#2e7d5e] text-white rounded-lg hover:bg-[#256b50] transition"
            >
              Approve This Loan
            </button>
          )} */}
        </div>
      </div>
    </div>
  )
}