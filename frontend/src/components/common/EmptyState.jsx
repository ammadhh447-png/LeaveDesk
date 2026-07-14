import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No data found', description }) {
  return (
    <div className="section-card flex flex-col items-center justify-center py-14 text-center">
      <div className="empty-state-icon">
        <Inbox className="h-6 w-6 icon-muted" />
      </div>
      <h3 className="text-sm font-semibold text-theme">{title}</h3>
      {description && <p className="text-sm text-muted-theme mt-1 max-w-sm">{description}</p>}
    </div>
  );
}
