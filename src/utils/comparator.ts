import { Bom, Artifact, ComparisonResult } from '../types';

export class BomComparator {
  compare(bom: Bom, fromVersion: string, toVersion: string): ComparisonResult {
    const fromArtifacts = this.getArtifactsMap(bom, fromVersion);
    const toArtifacts = this.getArtifactsMap(bom, toVersion);

    const result: ComparisonResult = {
      fromVersion,
      toVersion,
      added: [],
      removed: [],
      updated: []
    };

    // Find added and updated artifacts
    for (const [key, artifact] of toArtifacts) {
      if (!fromArtifacts.has(key)) {
        result.added.push(artifact);
      } else {
        const fromArtifact = fromArtifacts.get(key)!;
        if (fromArtifact.version !== artifact.version) {
          result.updated.push({
            groupId: artifact.groupId,
            artifactId: artifact.artifactId,
            fromVersion: fromArtifact.version,
            toVersion: artifact.version
          });
        }
      }
    }

    // Find removed artifacts
    for (const [key, artifact] of fromArtifacts) {
      if (!toArtifacts.has(key)) {
        result.removed.push(artifact);
      }
    }

    // Sort results
    result.added.sort((a, b) => this.compareArtifacts(a, b));
    result.removed.sort((a, b) => this.compareArtifacts(a, b));
    result.updated.sort((a, b) => this.compareArtifacts(a, b));

    return result;
  }

  private getArtifactsMap(bom: Bom, version: string): Map<string, Artifact> {
    const versionData = bom.versions.find(v => v.version === version);
    if (!versionData) {
      throw new Error(`Version ${version} not found`);
    }

    const map = new Map<string, Artifact>();
    versionData.artifacts.forEach(artifact => {
      const key = `${artifact.groupId}:${artifact.artifactId}`;
      map.set(key, artifact);
    });

    return map;
  }

  private compareArtifacts(a: { groupId: string; artifactId: string }, b: { groupId: string; artifactId: string }): number {
    const aKey = `${a.groupId}:${a.artifactId}`;
    const bKey = `${b.groupId}:${b.artifactId}`;
    return aKey.localeCompare(bKey);
  }
}