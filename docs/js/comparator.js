class BomComparator {
    constructor() {
        this.data = null;
    }

    /**
     * Compare two BOM versions and return the differences
     */
    compare(bom, fromVersion, toVersion) {
        const fromArtifacts = this.getArtifactsMap(bom, fromVersion);
        const toArtifacts = this.getArtifactsMap(bom, toVersion);

        const result = {
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
                const fromArtifact = fromArtifacts.get(key);
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

    /**
     * Get artifacts as a Map for easy comparison
     */
    getArtifactsMap(bom, version) {
        const versionData = bom.versions.find(v => v.version === version);
        if (!versionData) {
            throw new Error(`Version ${version} not found`);
        }

        const map = new Map();
        versionData.artifacts.forEach(artifact => {
            const key = `${artifact.groupId}:${artifact.artifactId}`;
            map.set(key, artifact);
        });

        return map;
    }

    /**
     * Compare artifacts for sorting
     */
    compareArtifacts(a, b) {
        const aKey = `${a.groupId}:${a.artifactId}`;
        const bKey = `${b.groupId}:${b.artifactId}`;
        return aKey.localeCompare(bKey);
    }

    /**
     * Format comparison result as Markdown
     */
    toMarkdown(bom, result) {
        let markdown = `# ${bom.artifactId}: ${result.fromVersion} → ${result.toVersion}\n\n`;

        if (result.added.length > 0) {
            markdown += `## Added (${result.added.length})\n\n`;
            result.added.forEach(artifact => {
                markdown += `- ${artifact.groupId}:${artifact.artifactId}:${artifact.version}\n`;
            });
            markdown += '\n';
        }

        if (result.removed.length > 0) {
            markdown += `## Removed (${result.removed.length})\n\n`;
            result.removed.forEach(artifact => {
                markdown += `- ${artifact.groupId}:${artifact.artifactId}:${artifact.version}\n`;
            });
            markdown += '\n';
        }

        if (result.updated.length > 0) {
            markdown += `## Updated (${result.updated.length})\n\n`;
            result.updated.forEach(update => {
                markdown += `- ${update.groupId}:${update.artifactId}: ${update.fromVersion} → ${update.toVersion}\n`;
            });
        }

        return markdown;
    }
}