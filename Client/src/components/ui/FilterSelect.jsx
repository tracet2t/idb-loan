import Select from 'react-select'

// ─── Custom styles to match your IDB green theme ──────────────────────────
const customStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '38px',
    fontSize: '0.875rem',
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#2e7d5e' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(46,125,94,0.2)' : 'none',
    '&:hover': { borderColor: '#2e7d5e' },
    cursor: 'pointer',
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.875rem',
    backgroundColor: state.isSelected
      ? '#2e7d5e'
      : state.isFocused
      ? '#f0faf5'
      : 'white',
    color: state.isSelected ? 'white' : '#374151',
    cursor: 'pointer',
  }),
  placeholder: (base) => ({ ...base, color: '#94a3b8', fontSize: '0.875rem' }),
  singleValue: (base) => ({ ...base, color: '#374151' }),
  menu: (base) => ({ ...base, borderRadius: '0.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 50 }),
  clearIndicator: (base) => ({ ...base, color: '#94a3b8', '&:hover': { color: '#ef4444' }, padding: '4px' }),
  dropdownIndicator: (base) => ({ ...base, color: '#94a3b8', padding: '4px' }),
  indicatorSeparator: () => ({ display: 'none' }),
}

/**
 * FilterSelect — reusable react-select dropdown
 *
 * Props:
 *   options    – string[]  e.g. ['Northern', 'Southern']
 *   value      – string    current selected value
 *   onChange   – (val: string) => void
 *   placeholder – string  e.g. 'All Regions'
 *   className  – string   extra wrapper class
 */
export default function FilterSelect({ options = [], value, onChange, placeholder = 'Select...', className = '' }) {
  const safeOptions = Array.isArray(options) ? options : [];

  const selectOptions = safeOptions.map((o) => {
    const labelStr = typeof o === 'string' ? o : (o.name || o.label || '');
    return { 
      value: labelStr, 
      label: labelStr.charAt(0).toUpperCase() + labelStr.slice(1) 
    };
  });

const selected = value && typeof value === 'string' 
  ? { value, label: value.charAt(0).toUpperCase() + value.slice(1) } 
  : null;
  
  return (
    <div className={`min-w-[150px] ${className}`}>
      <Select
        options={selectOptions}
        value={selected}
        onChange={(opt) => onChange(opt?.value || '')}
        placeholder={placeholder}
        isClearable
        styles={customStyles}
      />
    </div>
  )
}