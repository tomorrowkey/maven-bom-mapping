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
        
        // Create a manifest file that lists all available BOMs
        val manifest = BomManifest(
            generated = LocalDateTime.now(),
            boms = mutableListOf()
        )
        
        config.boms.forEach { bomDef ->
            logger.info("Processing BOM: ${bomDef.groupId}:${bomDef.artifactId}")
            
            val bomKey = "${bomDef.groupId}.${bomDef.artifactId}"
            val bomDirPath = File(outputDirectory, bomKey)
            bomDirPath.mkdirs()
            
            val versions = mutableListOf<String>()
            
            // Find all snapshot files for this BOM
            val bomDir = File(config.settings.snapshotDirectory, bomDef.groupId)
            if (bomDir.exists() && bomDir.isDirectory) {
                val snapshotFiles = bomDir.listFiles { _, name ->
                    name.startsWith("${bomDef.artifactId}-") && name.endsWith(".yaml")
                } ?: emptyArray()
                
                snapshotFiles.forEach { snapshotFile ->
                    try {
                        val snapshot = bomExtractor.loadSnapshot(snapshotFile)
                        val version = snapshot.bomInfo.version
                        
                        // Save individual version file
                        val versionFile = File(bomDirPath, "${version}.json")
                        jsonMapper.writeValue(versionFile, VersionData(
                            version = version,
                            artifacts = snapshot.artifacts
                        ))
                        
                        versions.add(version)
                    } catch (e: Exception) {
                        logger.error("Error processing snapshot ${snapshotFile.name}: ${e.message}")
                    }
                }
            } else {
                logger.warn("No snapshots found for BOM: ${bomDef.groupId}:${bomDef.artifactId}")
            }
            
            if (versions.isNotEmpty()) {
                // Sort versions in ascending order (oldest first)
                versions.sortWith { a, b -> compareVersions(a, b) }
                
                // Save BOM metadata file with just version list
                val bomMetadata = BomMetadata(
                    groupId = bomDef.groupId,
                    artifactId = bomDef.artifactId,
                    versions = versions
                )
                val metadataFile = File(bomDirPath, "metadata.json")
                jsonMapper.writeValue(metadataFile, bomMetadata)
                
                logger.info("Generated ${versions.size} version files for ${bomKey}")
                
                // Add to manifest
                manifest.boms.add(BomManifestEntry(
                    groupId = bomDef.groupId,
                    artifactId = bomDef.artifactId,
                    directory = bomKey,
                    versionCount = versions.size
                ))
            }
        }
        
        // Save manifest file
        val manifestFile = File(outputDirectory, "manifest.json")
        manifestFile.parentFile?.mkdirs()
        jsonMapper.writeValue(manifestFile, manifest)
        
        logger.info("JSON manifest generated: ${manifestFile.absolutePath}")
        return manifestFile
    }
    
    data class BomManifest(
        val generated: LocalDateTime,
        val boms: MutableList<BomManifestEntry>
    )
    
    data class BomManifestEntry(
        val groupId: String,
        val artifactId: String,
        val directory: String,
        val versionCount: Int
    )
    
    data class BomMetadata(
        val groupId: String,
        val artifactId: String,
        val versions: List<String>
    )
    
    data class VersionData(
        val version: String,
        val artifacts: List<com.example.bommapping.model.Artifact>
    )
    
    private fun compareVersions(version1: String, version2: String): Int {
        val parts1 = version1.split(Regex("[.-]")).map { part ->
            val num = part.toIntOrNull()
            if (num != null) num else part
        }
        val parts2 = version2.split(Regex("[.-]")).map { part ->
            val num = part.toIntOrNull()
            if (num != null) num else part
        }
        
        val maxLength = maxOf(parts1.size, parts2.size)
        for (i in 0 until maxLength) {
            val part1 = if (i < parts1.size) parts1[i] else 0
            val part2 = if (i < parts2.size) parts2[i] else 0
            
            when {
                part1 is Int && part2 is Int -> {
                    if (part1 != part2) return part1.compareTo(part2)
                }
                part1 is String && part2 is String -> {
                    if (part1 != part2) return part1.compareTo(part2)
                }
                part1 is Int && part2 is String -> return -1
                part1 is String && part2 is Int -> return 1
            }
        }
        return 0
    }
}