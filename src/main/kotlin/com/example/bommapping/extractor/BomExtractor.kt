package com.example.bommapping.extractor

import com.example.bommapping.fetcher.PomFetcher
import com.example.bommapping.model.BomSnapshot
import com.example.bommapping.parser.PomParser
import com.fasterxml.jackson.databind.DeserializationFeature
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
        configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
    }
    
    fun extractBom(groupId: String, artifactId: String, version: String, force: Boolean = false): File {
        val snapshotFile = getSnapshotFile(groupId, artifactId, version)
        
        if (!force && snapshotFile.exists()) {
            logger.debug("Using cached snapshot: ${snapshotFile.absolutePath}")
            return snapshotFile
        }
        
        logger.info("Extracting BOM: $groupId:$artifactId:$version")
        
        // Download POM
        val pomContent = pomFetcher.downloadPom(groupId, artifactId, version)
        
        // Check for parent POM
        var parentPomContent: String? = null
        val xmlMapper = pomParser.getXmlMapper()
        val pomObj = xmlMapper.readValue(pomContent, PomParser.Pom::class.java)
        
        if (pomObj.parent != null && pomObj.parent.groupId != null && pomObj.parent.artifactId != null && pomObj.parent.version != null) {
            logger.info("Found parent POM: ${pomObj.parent.groupId}:${pomObj.parent.artifactId}:${pomObj.parent.version}")
            try {
                parentPomContent = pomFetcher.downloadPom(
                    pomObj.parent.groupId,
                    pomObj.parent.artifactId,
                    pomObj.parent.version
                )
            } catch (e: Exception) {
                logger.warn("Failed to download parent POM: ${e.message}")
            }
        }
        
        // Parse POM with parent
        val artifacts = pomParser.parsePom(pomContent, parentPomContent)
        
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