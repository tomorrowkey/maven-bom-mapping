package com.example.bommapping.model

data class ComparisonResult(
    val fromVersion: String,
    val toVersion: String,
    val added: List<Artifact>,
    val removed: List<Artifact>,
    val updated: List<ArtifactUpdate>
) {
    data class ArtifactUpdate(
        val groupId: String,
        val artifactId: String,
        val fromVersion: String,
        val toVersion: String
    )
    
    val hasChanges: Boolean
        get() = added.isNotEmpty() || removed.isNotEmpty() || updated.isNotEmpty()
}