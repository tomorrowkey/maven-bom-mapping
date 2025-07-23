package com.example.bommapping.model

import java.time.LocalDateTime

data class BomSnapshot(
    val bomInfo: BomInfo,
    val artifacts: List<Artifact>
) {
    data class BomInfo(
        val groupId: String,
        val artifactId: String,
        val version: String,
        val extractedAt: LocalDateTime = LocalDateTime.now()
    )
}