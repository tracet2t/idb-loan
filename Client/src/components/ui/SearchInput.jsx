import { Search, X } from 'lucide-react'

/**
 * SearchInput — reusable search bar with clear button
 *
 * Props:
 *   value      – string
 *   onChange   – (val: string) => void
 *   placeholder – string
 *   className  – string
 */
export default function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative flex-1 min-w-[200px] ${className}`}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/20 focus:border-[#2e7d5e]
          placeholder-slate-400 text-slate-700 transition"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}