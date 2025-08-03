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
  
  // Sort versions in ascending order (oldest first) - use existing order from JSON
  // The JSON is already sorted by the backend, so we don't need to re-sort
  const sortVersions = (versions: Array<{version: string}>) => {
    return versions; // JSON is already sorted in ascending order
  };

  return (
    <div className="controls">
      <div className="control-group">
        <label htmlFor="bom-select">BOM:</label>
        <select
          id="bom-select"
          value={selectedBom}
          onChange={(e) => onBomChange(e.target.value)}
        >
          <option value="">-- Select BOM --</option>
          {boms
            .slice()
            .sort((a, b) => `${a.groupId}:${a.artifactId}`.localeCompare(`${b.groupId}:${b.artifactId}`))
            .map((bom) => (
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
          <option value="">-- Select Version --</option>
          {currentBom ? sortVersions(currentBom.versions).map((version) => (
            <option key={version.version} value={version.version}>
              {version.version}
            </option>
          )) : null}
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
          <option value="">-- Select Version --</option>
          {currentBom ? sortVersions(currentBom.versions).map((version) => (
            <option key={version.version} value={version.version}>
              {version.version}
            </option>
          )) : null}
        </select>
      </div>
    </div>
  );
};