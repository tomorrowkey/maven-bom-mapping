package com.example.bommapping.generator

import com.example.bommapping.extractor.BomExtractor
import com.example.bommapping.model.BomConfig
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import org.slf4j.LoggerFactory
import java.io.File
import java.time.LocalDateTime

class JsonGenerator(
    private val bomExtractor: BomExtractor,
    private val outputDirectory: String = "./docs/data"
) {
    private val logger = LoggerFactory.getLogger(JsonGenerator::class.java)
    private val jsonMapper = ObjectMapper().apply {
        registerKotlinModule()
        registerModule(JavaTimeModule())
        disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
        enable(SerializationFeature.INDENT_OUTPUT)
    }
    
    fun generateJson(config: BomConfig): File {
        logger.info("Generating JSON data for GitHub Pages")
        
        val bomData = BomData(
            generated = LocalDateTime.now(),
            boms = mutableListOf()
        )
        
        config.boms.forEach { bomDef ->
            logger.info("Processing BOM: ${bomDef.groupId}:${bomDef.artifactId}")
            
            val bomVersions = BomVersions(
                groupId = bomDef.groupId,
                artifactId = bomDef.artifactId,
                versions = mutableListOf()
            )
            
            bomDef.versions.forEach { version ->
                try {
                    val snapshotFile = File(
                        config.settings.snapshotDirectory,
                        "${bomDef.groupId}/${bomDef.artifactId}-$version.yaml"
                    )
                    
                    if (snapshotFile.exists()) {
                        val snapshot = bomExtractor.loadSnapshot(snapshotFile)
                        bomVersions.versions.add(
                            VersionData(
                                version = version,
                                artifacts = snapshot.artifacts
                            )
                        )
                    } else {
                        logger.warn("Snapshot not found: ${snapshotFile.absolutePath}")
                    }
                } catch (e: Exception) {
                    logger.error("Error processing version $version: ${e.message}")
                }
            }
            
            if (bomVersions.versions.isNotEmpty()) {
                bomData.boms.add(bomVersions)
            }
        }
        
        // Save JSON
        val outputFile = File(outputDirectory, "boms.json")
        outputFile.parentFile?.mkdirs()
        jsonMapper.writeValue(outputFile, bomData)
        
        logger.info("JSON generated: ${outputFile.absolutePath}")
        return outputFile
    }
    
    data class BomData(
        val generated: LocalDateTime,
        val boms: MutableList<BomVersions>
    )
    
    data class BomVersions(
        val groupId: String,
        val artifactId: String,
        val versions: MutableList<VersionData>
    )
    
    data class VersionData(
        val version: String,
        val artifacts: List<com.example.bommapping.model.Artifact>
    )
}