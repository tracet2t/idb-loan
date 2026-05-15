import { Calendar, X } from 'lucide-react'

/**
 * DateFilter — date picker with clear button
 *
 * Props:
 *   value    – string  (YYYY-MM-DD)
 *   onChange – (val: string) => void
 */
export default function DateFilter({ value, onChange }) {
  return (
    <div className="relative">
      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/20 focus:border-[#2e7d5e]
          text-slate-600 transition appearance-none"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400 transition"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}