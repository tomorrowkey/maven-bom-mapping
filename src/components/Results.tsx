import React from 'react';
import { ComparisonResult, ProcessedArtifact } from '../types';

interface ResultsProps {
  result: ComparisonResult | null;
  filter: string;
}

export const Results: React.FC<ResultsProps> = ({ result, filter }) => {
  if (!result) return null;

  // Process artifacts into a unified list
  const artifactMap = new Map<string, ProcessedArtifact>();

  // Process removed artifacts
  result.removed.forEach(artifact => {
    const key = `${artifact.groupId}:${artifact.artifactId}`;
    artifactMap.set(key, {
      groupId: artifact.groupId,
      artifactId: artifact.artifactId,
      status: 'removed',
      fromVersion: artifact.version,
      toVersion: null
    });
  });

  // Process added artifacts
  result.added.forEach(artifact => {
    const key = `${artifact.groupId}:${artifact.artifactId}`;
    artifactMap.set(key, {
      groupId: artifact.groupId,
      artifactId: artifact.artifactId,
      status: 'added',
      fromVersion: null,
      toVersion: artifact.version
    });
  });

  // Process updated artifacts
  result.updated.forEach(update => {
    const key = `${update.groupId}:${update.artifactId}`;
    artifactMap.set(key, {
      groupId: update.groupId,
      artifactId: update.artifactId,
      status: 'updated',
      fromVersion: update.fromVersion,
      toVersion: update.toVersion
    });
  });

  // Sort artifacts alphabetically
  const sortedArtifacts = Array.from(artifactMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));

  // Filter artifacts
  const filteredArtifacts = sortedArtifacts.filter(([key]) =>
    key.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="results">
      <div className="result-header">
        <h3>比較結果: {result.fromVersion} → {result.toVersion}</h3>
        <div className="result-summary">
          <span className="added-count">追加: {result.added.length}</span>
          <span className="removed-count">削除: {result.removed.length}</span>
          <span className="updated-count">更新: {result.updated.length}</span>
        </div>
      </div>

      {sortedArtifacts.length === 0 ? (
        <div className="empty-state">変更はありません</div>
      ) : (
        <div className="artifact-list">
          {filteredArtifacts.map(([key, artifact]) => (
            <div
              key={key}
              className={`artifact-item ${artifact.status}`}
            >
              <div className="artifact-content">
                <span className="artifact-name">
                  {artifact.groupId}:{artifact.artifactId}
                </span>
                <span className="version-info">
                  {artifact.status === 'added' && (
                    <span className="version-to">{artifact.toVersion}</span>
                  )}
                  {artifact.status === 'removed' && (
                    <span className="version-from">{artifact.fromVersion}</span>
                  )}
                  {artifact.status === 'updated' && (
                    <>
                      <span className="version-from">{artifact.fromVersion}</span>
                      <span className="version-arrow">→</span>
                      <span className="version-to">{artifact.toVersion}</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};