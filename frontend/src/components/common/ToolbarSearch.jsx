import { Search, X } from 'lucide-react';

export default function ToolbarSearch({
  value,
  onChange,
  onClear,
  placeholder = 'Search',
  wrapperClassName = 'toolbar-search',
  inputClassName = 'toolbar-input',
}) {
  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClear) {
      onClear();
      return;
    }
    onChange({ target: { value: '' } });
  };

  return (
    <div className={wrapperClassName}>
      <Search className="h-4 w-4 icon-muted shrink-0" />
      <input
        className={inputClassName}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {value && (
        <button
          type="button"
          className="toolbar-clear-btn"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
