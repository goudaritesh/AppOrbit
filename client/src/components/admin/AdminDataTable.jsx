import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Admin Data Table with Search, Filter Slots, and Server Pagination
 */
export const AdminDataTable = ({
  columns = [],
  data = [],
  loading = false,
  pagination = { page: 1, pages: 1, total: 0 },
  onPageChange,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterSlot = null,
  emptyMessage = 'No records found matching criteria.',
}) => {
  return (
    <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col">
      {/* Top Search & Filter Bar */}
      {(onSearchChange || filterSlot) && (
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface/30">
          {onSearchChange && (
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-content-primary text-xs focus:outline-none focus:border-primary placeholder:text-content-muted"
              />
            </div>
          )}

          {filterSlot && <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">{filterSlot}</div>}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-surface/50 text-content-muted font-mono uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3.5 px-4 ${col.className || ''}`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-sans">
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="py-4 px-4">
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-content-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr
                  key={row._id || row.id || rIdx}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`py-3.5 px-4 ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-content-muted font-mono bg-surface/30">
          <span>
            Total: <strong className="text-content-primary">{pagination.total}</strong> records
          </span>

          <div className="flex items-center gap-2">
            <span>
              Page {pagination.page} of {pagination.pages || 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1 || loading}
                onClick={() => onPageChange(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= (pagination.pages || 1) || loading}
                onClick={() => onPageChange(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDataTable;
