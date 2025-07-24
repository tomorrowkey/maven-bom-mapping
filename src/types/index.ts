export interface Artifact {
  groupId: string;
  artifactId: string;
  version: string;
}

export interface BomVersion {
  version: string;
  generated: string;
  artifacts: Artifact[];
}

export interface Bom {
  groupId: string;
  artifactId: string;
  versions: BomVersion[];
}

export interface BomData {
  generated: string;
  boms: Bom[];
}

export interface ComparisonResult {
  fromVersion: string;
  toVersion: string;
  added: Artifact[];
  removed: Artifact[];
  updated: {
    groupId: string;
    artifactId: string;
    fromVersion: string;
    toVersion: string;
  }[];
}

export interface ProcessedArtifact {
  groupId: string;
  artifactId: string;
  status: 'added' | 'removed' | 'updated' | 'unchanged';
  fromVersion: string | null;
  toVersion: string | null;
}