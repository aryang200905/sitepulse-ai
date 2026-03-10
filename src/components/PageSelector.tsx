'use client';

interface PageSelectorProps {
  pages: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
}

export default function PageSelector({ pages, selected, onSelectionChange }: PageSelectorProps) {
  const togglePage = (page: string) => {
    if (selected.includes(page)) {
      onSelectionChange(selected.filter((p) => p !== page));
    } else {
      onSelectionChange([...selected, page]);
    }
  };

  const selectAll = () => onSelectionChange([...pages]);
  const deselectAll = () => onSelectionChange([]);

  return (
    <div className="page-selector" id="page-selector">
      <div className="page-selector-header">
        <h3>Detected Pages</h3>
        <div className="page-selector-actions">
          <button onClick={selectAll} className="link-btn">Select All</button>
          <button onClick={deselectAll} className="link-btn">Deselect All</button>
        </div>
      </div>
      <ul className="page-list">
        {pages.map((page) => (
          <li key={page} className="page-item">
            <label>
              <input
                type="checkbox"
                checked={selected.includes(page)}
                onChange={() => togglePage(page)}
              />
              <span className="page-url">{page}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
