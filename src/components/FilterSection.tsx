import React from 'react';

interface FilterSectionProps {
  visible: boolean;
  value: string;
  onChange: (value: string) => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({ visible, value, onChange }) => {
  if (!visible) return null;

  return (
    <div className="filter-section">
      <input
        type="text"
        id="filter-input"
        placeholder="アーティファクトを検索..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};