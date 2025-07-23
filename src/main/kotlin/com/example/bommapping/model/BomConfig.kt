package com.example.bommapping.model

data class BomConfig(
    val boms: List<BomDefinition>,
    val settings: Settings = Settings()
) {
    data class BomDefinition(
        val groupId: String,
        val artifactId: String,
        val versions: List<String>
    )
    
    data class Settings(
        val mavenRepository: String = "https://repo1.maven.org/maven2/",
        val snapshotDirectory: String = "./snapshots",
        val cacheEnabled: Boolean = true
    )
}