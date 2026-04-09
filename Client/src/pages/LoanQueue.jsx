import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Eye, CheckCircle, X } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

import { loanService } from '../api/loanService'
import LoanDetailModal from '../components/LoanDetailModal'

// ─── Reusable filter components ────────────────────────────────────────────
import SearchInput  from '../components/ui/SearchInput'
import FilterSelect from '../components/ui/FilterSelect'
import DateFilter   from '../components/ui/DateFilter'

// ─── Filter options ────────────────────────────────────────────────────────
const REGIONS  = ['Northern', 'Southern', 'Central', 'Western', 'Eastern', 'Sabaragamuwa', 'North Central', 'North Western', 'Uva']
const SECTORS  = ['Agriculture', 'Fisheries', 'SME', 'Technology', 'Education', 'Healthcare', 'Manufacturing']
const STATUSES = ['Pending', 'Approved', 'Rejected']

// ─── Status badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    Approved: 'bg-[#2e7d5e] text-white',
    Pending:  'bg-[#1a2535] text-white',
    Rejected: 'bg-red-600 text-white',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-slate-200 text-slate-600'}`}>
      {status}
    </span>
  )
}

// ─── Skeleton row ──────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-slate-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <tr>
      <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#cbd5e1" strokeWidth="1.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-medium">No loans found</p>
          <p className="text-xs">Try adjusting your filters</p>
        </div>
      </td>
    </tr>
  )
}

// ─── Main component ────────────────────────────────────────────────────────
export default function LoanQueue() {
  const [loans,          setLoans]          = useState([])
  const [pagination,     setPagination]     = useState({ total: 0, page: 1, totalPages: 1 })
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [search,         setSearch]         = useState('')
  const [region,         setRegion]         = useState('')
  const [sector,         setSector]         = useState('')
  const [status,         setStatus]         = useState('')
  const [date,           setDate]           = useState('')
  const [page,           setPage]           = useState(1)
  const [selectedLoan,   setSelectedLoan]   = useState(null)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [approvingId,    setApprovingId]    = useState(null)
  const [approveLoading, setApproveLoading] = useState(false)

  const hasFilters = search || region || sector || status || date

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchLoans = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 10 }
      if (search) params.search = search
      if (region) params.region = region
      if (sector) params.sector = sector
      if (status) params.status = status

      const res  = await loanService.getLoans(params)
      let   data = res.data.loans

      // Client-side date filter
      if (date) {
        data = data.filter((l) =>
          new Date(l.appliedDate).toDateString() === new Date(date).toDateString()
        )
      }

      setLoans(data)
      setPagination(res.data.pagination)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load loans. Is the server running?'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [page, search, region, sector, status, date])

  useEffect(() => { fetchLoans() }, [fetchLoans])
  useEffect(() => { setPage(1)   }, [search, region, sector, status, date])

  // ── Clear all filters ────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearch(''); setRegion(''); setSector(''); setStatus(''); setDate('')
  }

  // ── Approve ──────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setApproveLoading(true)
    try {
      await loanService.updateLoanStatus(id, 'Approved', 'Approved by officer')
      setApprovingId(null)
      toast.success('Loan approved successfully!')
      fetchLoans()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed')
    } finally {
      setApproveLoading(false)
    }
  }

  // ── View detail ──────────────────────────────────────────────────────────
  const handleView = async (loan) => {
    try {
      const res = await loanService.getLoanById(loan._id)
      setSelectedLoan(res.data)
    } catch {
      setSelectedLoan(loan)
    }
    setModalOpen(true)
  }

  return (
    <>
      {/* Toast container */}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Global Loan Queue</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {pagination.total} applications · Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>

        {/* ── Filter bar ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-center">

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name..."
          />

          <FilterSelect
            options={REGIONS}
            value={region}
            onChange={setRegion}
            placeholder="All Regions"
          />

          <FilterSelect
            options={SECTORS}
            value={sector}
            onChange={setSector}
            placeholder="All Sectors"
          />

          <FilterSelect
            options={STATUSES}
            value={status}
            onChange={setStatus}
            placeholder="All Status"
          />

          <DateFilter value={date} onChange={setDate} />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition px-2 py-2"
            >
              <X size={13} /> Clear all
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <X size={15} /> {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Applicant</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">NIC</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Region & Sector</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount (LKR)</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
                : loans.length === 0
                ? <EmptyState />
                : loans.map((loan, idx) => (
                  <tr key={loan._id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">

                    <td className="px-5 py-4 text-slate-500 font-mono text-xs">
                      #{(pagination.page - 1) * 10 + idx + 1}
                      {loan.priority && (
                        <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-orange-400 align-middle" title="Priority" />
                      )}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">{loan.applicantName}</td>
                    <td className="px-5 py-4 text-slate-500 font-mono text-xs">{loan.nic}</td>

                    <td className="px-5 py-4">
                      <p className="text-slate-700 font-medium">{loan.region}</p>
                      <p className="text-slate-400 text-xs">{loan.sector}</p>
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-slate-700">
                      {Number(loan.amount).toLocaleString('en-LK')}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={loan.status} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">

                        {/* View */}
                        <button
                          onClick={() => handleView(loan)}
                          title="View Details"
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#2e7d5e] border border-slate-200 hover:border-[#2e7d5e] px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          <Eye size={13} />
                        </button>

                        {/* Approve */}
                        {loan.status === 'Pending' && (
                          approvingId === loan._id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleApprove(loan._id)}
                                disabled={approveLoading}
                                className="text-xs bg-[#2e7d5e] text-white px-2.5 py-1.5 rounded-lg hover:bg-[#256b50] transition disabled:opacity-60"
                              >
                                {approveLoading ? '...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setApprovingId(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg border border-slate-200 transition"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setApprovingId(loan._id)}
                              className="flex items-center gap-1 text-xs text-[#2e7d5e] border border-[#2e7d5e]/40 hover:bg-[#2e7d5e] hover:text-white px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              <CheckCircle size={13} />
                              <span>Approve</span>
                            </button>
                          )
                        )}

                        <button className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>

          {/* Pagination */}
          {!loading && loans.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Showing {(pagination.page - 1) * 10 + 1}–{Math.min(pagination.page * 10, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={15} />
                </button>
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 text-xs rounded-lg border transition ${
                      page === i + 1
                        ? 'bg-[#2e7d5e] text-white border-[#2e7d5e]'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {modalOpen && (
        <LoanDetailModal
          loan={selectedLoan}
          onClose={() => { setModalOpen(false); setSelectedLoan(null) }}
          onApprove={(id) => { handleApprove(id); setModalOpen(false) }}
        />
      )}
    </>
  )
}