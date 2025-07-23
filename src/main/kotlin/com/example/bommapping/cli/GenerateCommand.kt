package com.example.bommapping.cli

import com.example.bommapping.config.ConfigLoader
import com.example.bommapping.extractor.BomExtractor
import com.example.bommapping.fetcher.PomFetcher
import com.example.bommapping.generator.JsonGenerator
import com.example.bommapping.parser.PomParser
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
    
    override fun run() {
        try {
            // Load configuration
            val config = ConfigLoader().load(configFile)
            logger.info("Loaded configuration from: $configFile")
            
            // Initialize components
            val pomFetcher = PomFetcher(config.settings.mavenRepository)
            val pomParser = PomParser()
            val bomExtractor = BomExtractor(
                pomFetcher = pomFetcher,
                pomParser = pomParser,
                snapshotDirectory = config.settings.snapshotDirectory
            )
            val jsonGenerator = JsonGenerator(bomExtractor)
            
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
            logger.info("Processing ${bomsToProcess.size} BOM(s)")
            
            bomsToProcess.forEach { bomDef ->
                logger.info("Processing BOM: ${bomDef.groupId}:${bomDef.artifactId}")
                
                bomDef.versions.forEach { version ->
                    try {
                        bomExtractor.extractBom(
                            groupId = bomDef.groupId,
                            artifactId = bomDef.artifactId,
                            version = version,
                            force = force || !config.settings.cacheEnabled
                        )
                        logger.info("✓ Extracted: ${bomDef.artifactId}-$version")
                    } catch (e: Exception) {
                        logger.error("✗ Failed to extract ${bomDef.artifactId}-$version: ${e.message}")
                    }
                }
            }
            
            // Generate JSON
            logger.info("Generating JSON for GitHub Pages...")
            val outputFile = jsonGenerator.generateJson(config)
            logger.info("✓ JSON generated: ${outputFile.absolutePath}")
            
            logger.info("Generation complete!")
            
        } catch (e: Exception) {
            logger.error("Error during generation: ${e.message}", e)
            throw e
        }
    }
}