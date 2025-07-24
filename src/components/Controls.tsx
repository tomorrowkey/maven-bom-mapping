import React from 'react';
import { Bom } from '../types';

interface ControlsProps {
  boms: Bom[];
  selectedBom: string;
  selectedFromVersion: string;
  selectedToVersion: string;
  onBomChange: (value: string) => void;
  onFromVersionChange: (value: string) => void;
  onToVersionChange: (value: string) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  boms,
  selectedBom,
  selectedFromVersion,
  selectedToVersion,
  onBomChange,
  onFromVersionChange,
  onToVersionChange,
}) => {
  const currentBom = boms.find(b => `${b.groupId}:${b.artifactId}` === selectedBom);

  return (
    <div className="controls">
      <div className="control-group">
        <label htmlFor="bom-select">BOM:</label>
        <select
          id="bom-select"
          value={selectedBom}
          onChange={(e) => onBomChange(e.target.value)}
        >
          <option value="">-- BOMを選択 --</option>
          {boms.map((bom) => (
            <option
              key={`${bom.groupId}:${bom.artifactId}`}
              value={`${bom.groupId}:${bom.artifactId}`}
            >
              {bom.groupId}:{bom.artifactId}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="version-from">From:</label>
        <select
          id="version-from"
          value={selectedFromVersion}
          onChange={(e) => onFromVersionChange(e.target.value)}
          disabled={!currentBom}
        >
          <option value="">-- バージョンを選択 --</option>
          {currentBom?.versions.map((version) => (
            <option key={version.version} value={version.version}>
              {version.version}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="version-to">To:</label>
        <select
          id="version-to"
          value={selectedToVersion}
          onChange={(e) => onToVersionChange(e.target.value)}
          disabled={!currentBom}
        >
          <option value="">-- バージョンを選択 --</option>
          {currentBom?.versions.map((version) => (
            <option key={version.version} value={version.version}>
              {version.version}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};