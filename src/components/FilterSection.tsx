import React, { useState } from 'react';

interface FilterSectionProps {
  visible: boolean;
  value: string;
  onChange: (value: string) => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({ visible, value, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!visible) return null;

  return (
    <div className="filter-section">
      <button 
        className="filter-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label="検索フィルターを切り替え"
      >
        <svg 
          className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 16 16"
        >
          <path d="M6.02945 10.20713c-.48173.48173-1.26227.48173-1.744 0l-2.24848-2.24848c-.48173-.48173-.48173-1.26227 0-1.744l.00303-.00303c.48173-.48173 1.26227-.48173 1.744 0l1.37097 1.37097 3.71194-3.71194c.48173-.48173 1.26227-.48173 1.744 0l.00303.00303c.48173.48173.48173 1.26227 0 1.744L6.02945 10.20713z"/>
        </svg>
        <span>検索フィルター</span>
        {value && <span className="filter-badge">1</span>}
      </button>
      
      {isExpanded && (
        <div className="filter-content">
          <input
            type="text"
            id="filter-input"
            placeholder="アーティファクトを検索..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
          />
        </div>
      )}
    </div>
  );
};