export interface Artifact {
  groupId: string;
  artifactId: string;
  version: string;
}

export interface BomVersion {
  version: string;
  artifacts: Artifact[];
}

export interface Bom {
  groupId: string;
  artifactId: string;
  directory?: string;
  versions: BomVersion[];
}

export interface BomData {
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
  unchanged: Artifact[];
}

export interface ProcessedArtifact {
  groupId: string;
  artifactId: string;
  status: 'added' | 'removed' | 'updated' | 'unchanged';
  fromVersion: string | null;
  toVersion: string | null;
}