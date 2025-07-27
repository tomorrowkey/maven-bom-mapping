import { ComparisonResult } from '../types';

export function generateDiff(result: ComparisonResult, bomName: string): string {
  const lines: string[] = [];
  
  // Get current URL
  const currentUrl = window.location.href;
  
  // Add URL and title outside code block
  const title = `${bomName} comparison: ${result.fromVersion} → ${result.toVersion}`;
  lines.push(`[${title}](${currentUrl})`);
  lines.push('');
  
  // Start with markdown code block
  lines.push('```diff');
  lines.push(`--- ${bomName} ${result.fromVersion}`);
  lines.push(`+++ ${bomName} ${result.toVersion}`);
  lines.push('');
  
  // Create a combined sorted list of all artifacts
  const allArtifacts = new Map<string, { status: 'added' | 'removed' | 'updated' | 'unchanged', artifact: any }>();
  
  // Add removed artifacts
  result.removed.forEach(artifact => {
    const key = `${artifact.groupId}:${artifact.artifactId}`;
    allArtifacts.set(key, { status: 'removed', artifact });
  });
  
  // Add added artifacts
  result.added.forEach(artifact => {
    const key = `${artifact.groupId}:${artifact.artifactId}`;
    allArtifacts.set(key, { status: 'added', artifact });
  });
  
  // Add updated artifacts
  result.updated.forEach(update => {
    const key = `${update.groupId}:${update.artifactId}`;
    allArtifacts.set(key, { status: 'updated', artifact: update });
  });
  
  // Add unchanged artifacts
  result.unchanged.forEach(artifact => {
    const key = `${artifact.groupId}:${artifact.artifactId}`;
    allArtifacts.set(key, { status: 'unchanged', artifact });
  });
  
  // Sort by key
  const sortedKeys = Array.from(allArtifacts.keys()).sort();
  
  // Generate diff lines
  sortedKeys.forEach(key => {
    const item = allArtifacts.get(key)!;
    
    switch (item.status) {
      case 'removed':
        lines.push(`-${item.artifact.coordinates}`);
        break;
      case 'added':
        lines.push(`+${item.artifact.coordinates}`);
        break;
      case 'updated':
        lines.push(`-${item.artifact.groupId}:${item.artifact.artifactId}:${item.artifact.fromVersion}`);
        lines.push(`+${item.artifact.groupId}:${item.artifact.artifactId}:${item.artifact.toVersion}`);
        break;
      case 'unchanged':
        lines.push(` ${item.artifact.coordinates}`);
        break;
    }
  });
  
  lines.push('```');
  
  return lines.join('\n');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}