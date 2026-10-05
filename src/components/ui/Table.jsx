import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, Skeleton } from './Feedback';

/**
 * Minimal data table.
 * columns: [{ key, header, render?(row), className?, headerClassName? }]
 */
export default function DataTable({
  columns,
  rows,
  loading,
  error,
  onRetry,
  empty,
  rowKey = (r) => r.id,
  onRowClick,
  className,
}) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.headerClassName}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key}>
                      <Skeleton className="h-4 w-full max-w-40" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={c.className}>
                      {c.render ? c.render(row) : row[c.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && rows.length === 0 && (empty || <EmptyState title="Nothing here yet" description="No records match your filters." />)}
    </div>
  );
}
