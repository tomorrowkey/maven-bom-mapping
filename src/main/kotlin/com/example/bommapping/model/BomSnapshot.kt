package com.example.bommapping.model

data class BomSnapshot(
    val bomInfo: BomInfo,
    val artifacts: List<Artifact>
) {
    data class BomInfo(
        val groupId: String,
        val artifactId: String,
        val version: String
    )
}