
/**
 * LoanQueue.jsx  —  IDB Loan Management Portal
 *
 * Open-source libraries used:
 *  • @tanstack/react-table v8   — headless table (sorting, pagination, column visibility)
 *  • @headlessui/react          — accessible Dialog (modal) & Transition
 *  • react-datepicker           — accessible, localised date picker
 *  • react-loading-skeleton     — proper skeleton screens
 *  • react-select               — already in use (FilterSelect wrapper kept)
 *  • react-hot-toast            — already in use
 *  • xlsx (SheetJS)             — Excel export (common gov requirement)
 *  • lucide-react               — already in use
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import {
  
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Eye,
  CheckCircle,
  X,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

import { loanService } from '../api/loanService'
import LoanDetailModal from '../components/LoanDetailModal'
import EditLoanModal from '../components/ui/EditLoanModal'
import SearchInput from '../components/ui/SearchInput'
import FilterSelect from '../components/ui/FilterSelect'
import api from '../api/axios';

// ─── Constants ─────────────────────────────────────────────────────────────
// const REGIONS = [
//   'Northern', 'Southern', 'Central', 'Western', 'Eastern',
//   'Sabaragamuwa', 'North Central', 'North Western', 'Uva',
// ]
// const SECTORS = [
//   'Agriculture', 'Fisheries', 'SME', 'Technology',
//   'Education', 'Healthcare', 'Manufacturing',
// ]
const STATUSES = ['Pending', 'Approved']

const PAGE_SIZE_OPTIONS = [10, 25, 50]

// ─── Status badge ──────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Approved: 'bg-[#2e7d5e] text-white',
  Pending:  'bg-[#1a2535] text-white',
  Rejected: 'bg-red-600  text-white',
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
        STATUS_STYLES[status] ?? 'bg-slate-200 text-slate-600'
      }`}
    >
      {status}
    </span>
  )
}

// ─── Sort icon helper ──────────────────────────────────────────────────────
function SortIcon({ column }) {
  if (!column.getCanSort()) return null
  const sorted = column.getIsSorted()
  if (sorted === 'asc')  return <ArrowUp   size={13} className="inline ml-1 opacity-70" />
  if (sorted === 'desc') return <ArrowDown size={13} className="inline ml-1 opacity-70" />
  return <ArrowUpDown size={13} className="inline ml-1 opacity-30" />
}

// ─── Skeleton table body ───────────────────────────────────────────────────
function TableSkeleton({ rows = 8, cols = 7 }) {
  return (
    <SkeletonTheme baseColor="#f1f5f9" highlightColor="#e2e8f0">
      {[...Array(rows)].map((_, r) => (
        <tr key={r} className="border-b border-slate-100">
          {[...Array(cols)].map((_, c) => (
            <td key={c} className="px-5 py-4">
              <Skeleton height={14} borderRadius={6} />
            </td>
          ))}
        </tr>
      ))}
    </SkeletonTheme>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ hasFilters, onClear }) {
  return (
    <tr>
      <td colSpan={7} className="px-5 py-20 text-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="#cbd5e1" strokeWidth="1.2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-medium text-slate-500">No loan applications found</p>
          {hasFilters && (
            <button
              onClick={onClear}
              className="text-xs text-[#2e7d5e] hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Confirm-approve inline mini-form ─────────────────────────────────────
function ApproveCell({ loanId, approvingId, setApprovingId, onApprove, approveLoading }) {
  const isThis = approvingId === loanId

  return isThis ? (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onApprove(loanId)}
        disabled={approveLoading}
        className="text-xs bg-[#2e7d5e] text-white px-2.5 py-1.5 rounded-lg hover:bg-[#256b50] transition disabled:opacity-60 whitespace-nowrap"
      >
        {approveLoading ? '…' : 'Confirm'}
      </button>
      <button
        onClick={() => setApprovingId(null)}
        className="text-xs text-slate-400 hover:text-slate-600 p-1.5 rounded-lg border border-slate-200 transition"
        aria-label="Cancel"
      >
        <X size={12} />
      </button>
    </div>
  ) : (
    <button
      onClick={() => setApprovingId(loanId)}
      className="flex items-center gap-1 text-xs text-[#2e7d5e] border border-[#2e7d5e]/40 hover:bg-[#2e7d5e] hover:text-white px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
    >
      <CheckCircle size={13} />
      <span>Approve</span>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main component
// ═══════════════════════════════════════════════════════════════════════════
export default function LoanQueue() {
  const userRole = localStorage.getItem('role') || "";
  // ── Data state ────────────────────────────────────────────────────────
  const [loans,        setLoans]        = useState([])
  const [serverPagination, setServerPag] = useState({ total: 0, page: 1, totalPages: 1 })
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  // ── Filter state ──────────────────────────────────────────────────────
  const [search,  setSearch]  = useState('')
  const [regions, setRegions] = useState([]); 
  const [sectors, setSectors] = useState([]);
  const [status,  setStatus]  = useState('')
  const [date,    setDate]    = useState(null)   
  const [page,    setPage]    = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // ── Action state ──────────────────────────────────────────────────────
  const [selectedLoan,   setSelectedLoan]   = useState(null)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [approvingId,    setApprovingId]    = useState(null)
  const [approveLoading, setApproveLoading] = useState(false)
  const [exporting,      setExporting]      = useState(false)
  const [editLoan, setEditLoan] = useState(null)
  const [editOpen, setEditOpen] = useState(false)

  // ── Table sort state (TanStack) ───────────────────────────────────────
  const [sorting, setSorting] = useState([])

  const hasFilters = !!(search || regions || sectors || status || date)

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchLoans = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: pageSize }
      if (search) params.search = search
      if (regions) params.region = regions
      if (sectors) params.sector = sectors
      if (status) params.status = status

      const res  = await loanService.getLoans(params)
      let   data = res.data.loans

      // Client-side date filter (react-datepicker returns a Date object)
      if (date) {
        data = data.filter(
          (l) => new Date(l.appliedDate).toDateString() === date.toDateString()
        )
      }

      setLoans(data)
      setServerPag(res.data.pagination)
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to load loans. Is the server running?'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, regions, sectors, status, date])

  useEffect(() => { fetchLoans() }, [fetchLoans])
  useEffect(() => { setPage(1)   }, [search, regions, sectors, status, date, pageSize])

  useEffect(() => {
    const fetchMetadata = async () => {
  try {
    const [regRes, secRes] = await Promise.all([
      api.get('/loans/regions'),
      api.get('/loans/sectors')
    ]);

    // console.log("Full Regions Response:", regRes);
    // console.log("Data Inside Regions:", regRes.data);
    if (regRes.data && Array.isArray(regRes.data)) {
      const mappedRegions = regRes.data
        .map(r => (typeof r === 'string' ? r : r.name))
        .filter(name => name); 
      
      setRegions(mappedRegions);
    }
    
    if (secRes.data && Array.isArray(secRes.data)) {
      const mappedSectors = secRes.data
        .map(s => (typeof s === 'string' ? s : s.name))
        .filter(name => name);
        
      setSectors(mappedSectors);
    }
  } catch (err) {
    console.error("Metadata fetch error:", err);
    setRegions([]);
    setSectors([]);
  }
  }
    fetchMetadata();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearch(''); setRegions(''); setSectors(''); setStatus(''); setDate(null)
  }

const handleApprove = useCallback(async (id) => {
  setApproveLoading(true);
  try {
    await api.patch(`/loans/${id}/approve`, { status: 'Approved' });
    toast.success('Loan approved successfully');
    fetchLoans(); 
  } catch (error) {
    toast.error(error.response?.data?.message || 'Approval failed');
  } finally {
    setApproveLoading(false);
    setApprovingId(null);
  }
}, [fetchLoans]);

  const handleView = async (loan) => {
    try {
      const res = await loanService.getLoanById(loan._id)
      setSelectedLoan(res.data)
    } catch {
      setSelectedLoan(loan)
    }
    setModalOpen(true)
  }

  const handleEditSave = async (id, data) => {
    await loanService.updateLoanDetails(id, data)
    toast.success('Loan updated successfully!')
    fetchLoans()
  }


  // ── Excel export (ExcelJS) ────────────────────────────────────────────
 // Replace the handleExport function body:
const handleExport = async () => {
  setExporting(true)
  try {
    const params = { page: 1, limit: 9999 }
    if (search) params.search = search
    if (regions) params.region = regions
    if (sectors) params.sector = sectors
    if (status) params.status = status
    const res  = await loanService.getLoans(params)
    let   data = res.data.loans
    if (date) {
      data = data.filter(
        (l) => new Date(l.appliedDate).toDateString() === date.toDateString()
      )
    }

    const workbook  = new ExcelJS.Workbook()
    workbook.creator = 'IDB Loan Portal'
    workbook.created  = new Date()

    const sheet = workbook.addWorksheet('Loan Queue')

    // ── Column definitions with widths ──
    sheet.columns = [
      { header: '#',              key: 'serial',      width: 6  },
      { header: 'Applicant Name', key: 'name',        width: 26 },
      { header: 'NIC',            key: 'nic',         width: 16 },
      { header: 'Region',         key: 'region',      width: 18 },
      { header: 'Sector',         key: 'sector',      width: 18 },
      { header: 'Amount (LKR)',   key: 'amount',      width: 16 },
      { header: 'Status',         key: 'status',      width: 12 },
      { header: 'Applied Date',   key: 'appliedDate', width: 16 },
      { header: 'Priority',       key: 'priority',    width: 10 },
    ]

    // ── Style the header row ──
    sheet.getRow(1).eachCell((cell) => {
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D5E' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border    = {
        bottom: { style: 'thin', color: { argb: 'FF1A5C45' } },
      }
    })
    sheet.getRow(1).height = 22

    // ── Add data rows ──
    data.forEach((l, i) => {
      const row = sheet.addRow({
        serial:      i + 1,
        name:        l.applicantName,
        nic:         l.nic,
        region:      l.region,
        sector:      l.sector,
        amount:      Number(l.amount),
        status:      l.status,
        appliedDate: l.appliedDate
          ? new Date(l.appliedDate).toLocaleDateString('en-LK')
          : '',
        priority:    l.priority ? 'Yes' : 'No',
      })

      // Zebra striping
      if (i % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FFFE' } }
        })
      }

      // Color-code status cell
      const statusCell = row.getCell('status')
      const statusColors = {
        Approved: { argb: 'FF2E7D5E' },
        Rejected: { argb: 'FFDC2626' },
        Pending:  { argb: 'FF1A2535' },
      }
      if (statusColors[l.status]) {
        statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
        statusCell.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: statusColors[l.status],
        }
        statusCell.alignment = { horizontal: 'center' }
      }

      // Right-align amount
      row.getCell('amount').alignment = { horizontal: 'right' }
      row.getCell('amount').numFmt    = '#,##0'
    })

    // ── Freeze header row ──
    sheet.views = [{ state: 'frozen', ySplit: 1 }]

    // ── Write and trigger download ──
    const buffer = await workbook.xlsx.writeBuffer()
    const blob   = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const timestamp = new Date().toISOString().slice(0, 10)
    saveAs(blob, `IDB_LoanQueue_${timestamp}.xlsx`)
    toast.success('Export ready — check your downloads.')
  } catch (err) {
    console.error(err)
    toast.error('Export failed. Please try again.')
  } finally {
    setExporting(false)
  }
}

  // ─── TanStack Table column definitions ─────────────────────────────────
  const columns = useMemo(
    () => [
      
      {
        id: 'serial',
        header: 'ID',
        accessorFn: (_, idx) => (serverPagination.page - 1) * pageSize + idx + 1,
        enableSorting: false,
        cell: ({ getValue, row }) => (
          <span className="text-slate-500 font-mono text-xs">
            #{getValue()}
            {row.original.priority && (
              <span
                className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-orange-400 align-middle"
                title="Priority application"
              />
            )}
          </span>
        ),
        size: 60,
      },
      {
        id: 'applicantName',
        header: 'Applicant',
        accessorKey: 'applicantName',
        cell: ({ getValue }) => (
          <span className="font-medium text-slate-700">{getValue()}</span>
        ),
      },
      {
        id: 'nic',
        header: 'NIC',
        accessorKey: 'nic',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-slate-500">{getValue()}</span>
        ),
      },
      {
        id: 'regionSector',
        header: 'Region & Sector',
        accessorKey: 'region',
        cell: ({ row }) => (
          <>
            <p className="font-medium text-slate-700">{row.original.region}</p>
            <p className="text-xs text-slate-400">{row.original.sector}</p>
          </>
        ),
      },
      {
        id: 'amount',
        header: () => <span className="block text-right">Amount (LKR)</span>,
        accessorKey: 'amount',
        cell: ({ getValue }) => (
          <span className="block text-right font-semibold text-slate-700">
            {Number(getValue()).toLocaleString('en-LK')}
          </span>
        ),
      },
      {
        id: 'status',
        header: () => <span className="block text-center">Status</span>,
        accessorKey: 'status',
        cell: ({ getValue }) => (
          <div className="flex justify-center">
            <StatusBadge status={getValue()} />
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="block text-right">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const loan = row.original
          return (
            <div className="flex items-center justify-end gap-2">
              {/* View */}
              <button
                onClick={() => handleView(loan)}
                title="View Details"
                aria-label="View loan details"
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#2e7d5e] border border-slate-200 hover:border-[#2e7d5e] p-1.5 rounded-lg transition-all"
              >
                <Eye size={13} />
              </button>

              {/* Approve (Pending only) */}
              {loan.status === 'Pending' && userRole === 'super-admin' &&(
                <ApproveCell
                  loanId={loan._id}
                  approvingId={approvingId}
                  setApprovingId={setApprovingId}
                  onApprove={handleApprove}
                  approveLoading={approveLoading}
                />
              )}

           
              {loan.status === 'Pending' && (userRole === 'super-admin' || userRole === 'data-entry') &&(
                <button
                  onClick={() => { setEditLoan(loan); setEditOpen(true) }}
                  className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all"
                  aria-label="Edit loan"
                >
                  Edit
                </button>
              )}
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // [serverPagination.page, pageSize, approvingId, approveLoading]
    [serverPagination.page, pageSize, approvingId, approveLoading, userRole, handleApprove]
  )

  // ─── TanStack Table instance ────────────────────────────────────────────
  const table = useReactTable({
    data:           loans,
    columns,
    state:          { sorting },
    onSortingChange: setSorting,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,        // server handles pagination
    pageCount:        serverPagination.totalPages,
  })

  // ─── Pagination helpers ─────────────────────────────────────────────────
  const canPrev = page > 1
  const canNext = page < serverPagination.totalPages
  const visiblePages = useMemo(() => {
    const total = serverPagination.totalPages
    if (total <= 7) return [...Array(total)].map((_, i) => i + 1)
    if (page <= 4)  return [1, 2, 3, 4, 5, '…', total]
    if (page >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
    return [1, '…', page - 1, page, page + 1, '…', total]
  }, [page, serverPagination.totalPages])

  // ───────────────────────────────────────────────────────────────────────
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <div className="space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800"> Loan Queue</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {loading
                ? 'Loading applications…'
                : `${serverPagination.total} applications · Page ${serverPagination.page} of ${serverPagination.totalPages}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={fetchLoans}
              disabled={loading}
              title="Refresh"
              aria-label="Refresh loan list"
              className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Export to Excel */}
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#e09510] hover:bg-[#c8840e] px-3.5 py-2 rounded-lg transition disabled:opacity-60"
            >
              <Download size={13} />
              {exporting ? 'Exporting…' : 'Export Excel'}
            </button>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-center">

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name… or NIC"
          />

          <FilterSelect
            options={regions}
            value={regions}
            onChange={setRegions}
            placeholder="All Regions"
          />

          <FilterSelect
            options={sectors}
            value={sectors}
            onChange={setSectors}
            placeholder="All Sectors"
          />

          <FilterSelect
            options={STATUSES}
            value={status}
            onChange={setStatus}
            placeholder="All Status"
          />

          {/*
           * react-datepicker — replaces plain <input type="date">
           * Gives: keyboard navigation, locale formatting, clear button,
           *        screen-reader labels, mobile-friendly popover.
           */}
          <DatePicker
            selected={date}
            onChange={setDate}
            isClearable
            placeholderText="Filter by date"
            dateFormat="dd/MM/yyyy"
            maxDate={new Date()}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/30 focus:border-[#2e7d5e] w-40"
            wrapperClassName="flex-none"
            aria-label="Filter by applied date"
          />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition px-2 py-2"
            >
              <X size={13} /> Clear all
            </button>
          )}

          {/* Page-size selector */}
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/30"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
          >
            <X size={15} aria-hidden="true" /> {error}
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Loan applications">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="bg-slate-50 border-b border-slate-200">
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide select-none ${
                          header.column.getCanSort() ? 'cursor-pointer hover:text-slate-700' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                        aria-sort={
                          header.column.getIsSorted() === 'asc'  ? 'ascending'  :
                          header.column.getIsSorted() === 'desc' ? 'descending' : 'none'
                        }
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon column={header.column} />
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody>
                {loading ? (
                  <TableSkeleton rows={pageSize} cols={columns.length} />
                ) : loans.length === 0 ? (
                  <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination bar ── */}
          {!loading && loans.length > 0 && (
            <nav
              aria-label="Loan list pagination"
              className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100"
            >
              <p className="text-xs text-slate-400">
                Showing&nbsp;
                <strong className="text-slate-600 font-medium">
                  {(serverPagination.page - 1) * pageSize + 1}
                  –
                  {Math.min(serverPagination.page * pageSize, serverPagination.total)}
                </strong>
                &nbsp;of&nbsp;
                <strong className="text-slate-600 font-medium">{serverPagination.total}</strong>
                &nbsp;applications
              </p>

              <div className="flex items-center gap-1">
                {/* First */}
                <button
                  disabled={!canPrev}
                  onClick={() => setPage(1)}
                  aria-label="First page"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronsLeft size={14} />
                </button>

                {/* Prev */}
                <button
                  disabled={!canPrev}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={14} />
                </button>

                {/* Page numbers with ellipsis */}
                {visiblePages.map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} className="w-8 text-center text-slate-400 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      aria-label={`Page ${p}`}
                      aria-current={page === p ? 'page' : undefined}
                      className={`w-8 h-8 text-xs rounded-lg border transition ${
                        page === p
                          ? 'bg-[#2e7d5e] text-white border-[#2e7d5e] font-semibold'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  disabled={!canNext}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={14} />
                </button>

                {/* Last */}
                <button
                  disabled={!canNext}
                  onClick={() => setPage(serverPagination.totalPages)}
                  aria-label="Last page"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>

      {/* ── Loan Detail Modal (Headless UI Dialog) ── */}
      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => { setModalOpen(false); setSelectedLoan(null) }}
          aria-labelledby="loan-detail-title"
        >
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in  duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
          </Transition.Child>

          {/* Panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in  duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
                {/*
                 * LoanDetailModal receives: loan, onClose, onApprove
                 * The Dialog.Panel wrapper provides accessible focus-trap
                 * and keyboard-close (Escape) via @headlessui.
                 */}
                <LoanDetailModal
                  loan={selectedLoan}
                  onClose={() => { setModalOpen(false); setSelectedLoan(null) }}
                  onApprove={(id) => { handleApprove(id); setModalOpen(false) }}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      <EditLoanModal
        open={editOpen}
        loan={editLoan}
        onClose={() => { setEditOpen(false); setEditLoan(null) }}
        onSave={handleEditSave}
      />
    </>
  )
}