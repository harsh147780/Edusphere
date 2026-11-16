import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search' }) {
  return (
    <div className="relative max-w-md flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input className="input pl-10" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
