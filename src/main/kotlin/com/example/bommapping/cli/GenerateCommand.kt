package com.example.bommapping.cli

import com.example.bommapping.config.ConfigLoader
import com.example.bommapping.extractor.BomExtractor
import com.example.bommapping.fetcher.PomFetcher
import com.example.bommapping.generator.JsonGenerator
import com.example.bommapping.parser.PomParser
import com.example.bommapping.service.VersionDiscoveryService
import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.options.default
import com.github.ajalt.clikt.parameters.options.flag
import com.github.ajalt.clikt.parameters.options.option
import org.slf4j.LoggerFactory
import java.io.File

class GenerateCommand : CliktCommand(
    name = "generate",
    help = "Generate BOM data from Maven Central"
) {
    private val logger = LoggerFactory.getLogger(GenerateCommand::class.java)
    
    private val configFile by option(
        "--config", "-c",
        help = "Configuration file path"
    ).default("config.yaml")
    
    private val bomFilter by option(
        "--bom", "-b",
        help = "Process only specific BOM (artifactId)"
    )
    
    private val force by option(
        "--force", "-f",
        help = "Force regeneration, ignore cache"
    ).flag()
    
    private val parallel by option(
        "--parallel", "-p",
        help = "Enable parallel processing of BOMs"
    ).flag()
    
    override fun run() {
        val startTime = System.currentTimeMillis()
        try {
            // Load configuration
            val config = ConfigLoader().load(configFile)
            logger.info("Loaded configuration from: $configFile")
            
            // Initialize components (will be recreated per BOM if needed)
            val pomParser = PomParser()
            val versionDiscoveryService = VersionDiscoveryService()
            
            // Filter BOMs if specified
            val bomsToProcess = if (bomFilter != null) {
                config.boms.filter { it.artifactId == bomFilter }
            } else {
                config.boms
            }
            
            if (bomsToProcess.isEmpty()) {
                logger.error("No BOMs to process. Check your filter or configuration.")
                return
            }
            
            // Process BOMs
            logger.info("Processing ${bomsToProcess.size} BOM(s)${if (parallel) " in parallel" else ""}")
            
            if (parallel) {
                // Process BOMs in parallel
                bomsToProcess.parallelStream().forEach { bomDef ->
                    processBom(bomDef, config, versionDiscoveryService, pomParser, force)
                }
            } else {
                // Process BOMs sequentially
                bomsToProcess.forEach { bomDef ->
                    processBom(bomDef, config, versionDiscoveryService, pomParser, force)
                }
            }
            
            // Generate JSON
            logger.info("Generating JSON for GitHub Pages...")
            // Create a dummy BomExtractor for JSON generation (it will read from snapshots)
            val dummyPomFetcher = PomFetcher(config.settings.mavenRepository)
            val dummyBomExtractor = BomExtractor(
                pomFetcher = dummyPomFetcher,
                pomParser = pomParser,
                snapshotDirectory = config.settings.snapshotDirectory
            )
            val jsonGenerator = JsonGenerator(dummyBomExtractor)
            val outputFile = jsonGenerator.generateJson(config)
            logger.info("✓ JSON generated: ${outputFile.absolutePath}")
            
            val totalTime = System.currentTimeMillis() - startTime
            logger.info("Generation complete! Total time: ${totalTime / 1000.0}s")
            
        } catch (e: Exception) {
            logger.error("Error during generation: ${e.message}", e)
            throw e
        }
    }
    
    private fun processBom(
        bomDef: com.example.bommapping.model.BomConfig.BomDefinition,
        config: com.example.bommapping.model.BomConfig,
        versionDiscoveryService: VersionDiscoveryService,
        pomParser: PomParser,
        force: Boolean
    ) {
        logger.info("Processing BOM: ${bomDef.groupId}:${bomDef.artifactId}")
        
        // Determine which repository to use
        val repositoryUrl = when {
            bomDef.repository != null && config.settings.repositories.containsKey(bomDef.repository) -> 
                config.settings.repositories[bomDef.repository]!!
            bomDef.repository != null -> bomDef.repository // Direct URL
            else -> config.settings.mavenRepository
        }
        
        // Discover all available versions from the repository
        val versions = versionDiscoveryService.discoverVersions(
            baseUrl = repositoryUrl,
            groupId = bomDef.groupId,
            artifactId = bomDef.artifactId
        )
        
        if (versions.isEmpty()) {
            logger.warn("No versions found for ${bomDef.groupId}:${bomDef.artifactId}")
            return
        }
        
        logger.info("Found ${versions.size} versions for ${bomDef.artifactId}: ${versions.joinToString(", ")}")
        
        // Create repository-specific components
        val pomFetcher = PomFetcher(repositoryUrl)
        val bomExtractor = BomExtractor(
            pomFetcher = pomFetcher,
            pomParser = pomParser,
            snapshotDirectory = config.settings.snapshotDirectory
        )
        
        var extractedCount = 0
        var cachedCount = 0
        
        versions.forEachIndexed { index, version ->
            try {
                // Check if file already exists
                val snapshotFile = File(config.settings.snapshotDirectory, "${bomDef.groupId}/${bomDef.artifactId}-$version.yaml")
                val wasAlreadyCached = snapshotFile.exists()
                
                bomExtractor.extractBom(
                    groupId = bomDef.groupId,
                    artifactId = bomDef.artifactId,
                    version = version,
                    force = force || !config.settings.cacheEnabled
                )
                
                val progressInfo = "[${index + 1}/${versions.size}]"
                if (wasAlreadyCached && !force && config.settings.cacheEnabled) {
                    logger.info("$progressInfo ◦ Cached: ${bomDef.artifactId}-$version")
                    cachedCount++
                } else {
                    logger.info("$progressInfo ✓ Extracted: ${bomDef.artifactId}-$version")
                    extractedCount++
                }
            } catch (e: Exception) {
                val progressInfo = "[${index + 1}/${versions.size}]"
                logger.error("$progressInfo ✗ Failed to extract ${bomDef.artifactId}-$version: ${e.message}")
            }
        }
        
        logger.info("Summary for ${bomDef.artifactId}: extracted=$extractedCount, cached=$cachedCount, total=${versions.size}")
    }
}