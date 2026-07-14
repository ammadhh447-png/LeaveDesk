import StatusBadge from './StatusBadge';
import { formatDate, formatLeaveType } from '../../utils/helpers';
import EmptyState from './EmptyState';

export default function DataTable({ columns, data, onRowClick, emptyMessage }) {
  if (!data?.length) {
    return <EmptyState title={emptyMessage || 'No records found'} />;
  }

  return (
    <div className="data-table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row._id || idx}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row, idx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { StatusBadge, formatDate, formatLeaveType };
