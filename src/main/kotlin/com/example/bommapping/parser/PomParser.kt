package com.example.bommapping.parser

import com.example.bommapping.model.Artifact
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.dataformat.xml.XmlMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import org.slf4j.LoggerFactory

class PomParser {
    private val logger = LoggerFactory.getLogger(PomParser::class.java)
    private val xmlMapper = XmlMapper().apply {
        registerKotlinModule()
        configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
    }
    
    fun parsePom(pomContent: String): List<Artifact> {
        val pom = xmlMapper.readValue(pomContent, Pom::class.java)
        val artifacts = mutableListOf<Artifact>()
        
        // Extract artifacts from dependencyManagement section
        pom.dependencyManagement?.dependencies?.forEach { dependency ->
            if (dependency.groupId != null && dependency.artifactId != null && dependency.version != null) {
                artifacts.add(
                    Artifact(
                        groupId = dependency.groupId,
                        artifactId = dependency.artifactId,
                        version = dependency.version
                    )
                )
            }
        }
        
        logger.info("Parsed ${artifacts.size} artifacts from POM")
        return artifacts
    }
    
    data class Pom(
        val groupId: String? = null,
        val artifactId: String? = null,
        val version: String? = null,
        val dependencyManagement: DependencyManagement? = null
    )
    
    data class DependencyManagement(
        val dependencies: List<Dependency>? = null
    )
    
    data class Dependency(
        val groupId: String? = null,
        val artifactId: String? = null,
        val version: String? = null,
        val scope: String? = null,
        val type: String? = null
    )
}