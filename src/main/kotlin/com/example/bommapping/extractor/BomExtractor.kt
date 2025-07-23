package com.example.bommapping.extractor

import com.example.bommapping.fetcher.PomFetcher
import com.example.bommapping.model.BomSnapshot
import com.example.bommapping.parser.PomParser
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import org.slf4j.LoggerFactory
import java.io.File
import java.time.LocalDateTime

class BomExtractor(
    private val pomFetcher: PomFetcher,
    private val pomParser: PomParser,
    private val snapshotDirectory: String = "./snapshots"
) {
    private val logger = LoggerFactory.getLogger(BomExtractor::class.java)
    private val yamlMapper = ObjectMapper(YAMLFactory()).apply {
        registerKotlinModule()
        registerModule(JavaTimeModule())
        disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
    }
    
    fun extractBom(groupId: String, artifactId: String, version: String, force: Boolean = false): File {
        val snapshotFile = getSnapshotFile(groupId, artifactId, version)
        
        if (!force && snapshotFile.exists()) {
            logger.info("Using cached snapshot: ${snapshotFile.absolutePath}")
            return snapshotFile
        }
        
        logger.info("Extracting BOM: $groupId:$artifactId:$version")
        
        // Download POM
        val pomContent = pomFetcher.downloadPom(groupId, artifactId, version)
        
        // Parse POM
        val artifacts = pomParser.parsePom(pomContent)
        
        // Create snapshot
        val snapshot = BomSnapshot(
            bomInfo = BomSnapshot.BomInfo(
                groupId = groupId,
                artifactId = artifactId,
                version = version,
                extractedAt = LocalDateTime.now()
            ),
            artifacts = artifacts
        )
        
        // Save to YAML
        snapshotFile.parentFile?.mkdirs()
        yamlMapper.writeValue(snapshotFile, snapshot)
        
        logger.info("Snapshot saved: ${snapshotFile.absolutePath}")
        return snapshotFile
    }
    
    fun loadSnapshot(snapshotFile: File): BomSnapshot {
        return yamlMapper.readValue(snapshotFile, BomSnapshot::class.java)
    }
    
    private fun getSnapshotFile(groupId: String, artifactId: String, version: String): File {
        val dir = File(snapshotDirectory, groupId)
        return File(dir, "$artifactId-$version.yaml")
    }
}