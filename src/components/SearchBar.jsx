import { Search } from 'lucide-react'

export default function SearchBar({ placeholder = 'Rechercher...', value, onChange, className = '', ...props }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-low" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-surface-raised py-2.5 pl-10 pr-4 text-sm text-text-hi placeholder:text-text-low outline-none transition-colors focus:border-accent-blue/60"
        {...props}
      />
    </div>
  )
}
