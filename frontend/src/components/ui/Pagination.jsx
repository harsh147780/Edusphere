import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, onPage }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      <p className="text-sm text-slate-500">
        Page {page} of {pages}
      </p>
      <div className="flex gap-2">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <button className="btn-secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
