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
    
    fun getXmlMapper() = xmlMapper
    
    fun parsePom(pomContent: String, parentPomContent: String? = null): List<Artifact> {
        val pom = xmlMapper.readValue(pomContent, Pom::class.java)
        val parentPom = parentPomContent?.let { xmlMapper.readValue(it, Pom::class.java) }
        
        // Build properties map
        val properties = buildPropertiesMap(pom, parentPom)
        
        val artifacts = mutableListOf<Artifact>()
        
        // Extract artifacts from dependencyManagement section
        pom.dependencyManagement?.dependencies?.forEach { dependency ->
            if (dependency.groupId != null && dependency.artifactId != null && dependency.version != null) {
                artifacts.add(
                    Artifact(
                        groupId = resolveProperty(dependency.groupId, properties),
                        artifactId = resolveProperty(dependency.artifactId, properties),
                        version = resolveProperty(dependency.version, properties)
                    )
                )
            }
        }
        
        logger.info("Parsed ${artifacts.size} artifacts from POM")
        return artifacts
    }
    
    private fun buildPropertiesMap(pom: Pom, parentPom: Pom?): Map<String, String> {
        val properties = mutableMapOf<String, String>()
        
        // Add parent properties first
        parentPom?.properties?.forEach { (key, value) ->
            properties[key] = value
        }
        
        // Add current POM properties (overrides parent)
        pom.properties?.forEach { (key, value) ->
            properties[key] = value
        }
        
        // Add special properties
        properties["project.version"] = pom.version ?: parentPom?.version ?: ""
        properties["project.groupId"] = pom.groupId ?: parentPom?.groupId ?: ""
        properties["project.artifactId"] = pom.artifactId ?: ""
        
        // Resolve property references in property values
        val resolvedProperties = mutableMapOf<String, String>()
        properties.forEach { (key, value) ->
            resolvedProperties[key] = resolveProperty(value, properties)
        }
        
        return resolvedProperties
    }
    
    private fun resolveProperty(value: String, properties: Map<String, String>): String {
        var resolved = value
        val propertyPattern = "\\$\\{([^}]+)\\}".toRegex()
        
        propertyPattern.findAll(value).forEach { matchResult ->
            val propertyName = matchResult.groupValues[1]
            val propertyValue = properties[propertyName]
            if (propertyValue != null) {
                resolved = resolved.replace(matchResult.value, propertyValue)
            }
        }
        
        return resolved
    }
    
    data class Pom(
        val groupId: String? = null,
        val artifactId: String? = null,
        val version: String? = null,
        val parent: Parent? = null,
        val properties: Map<String, String>? = null,
        val dependencyManagement: DependencyManagement? = null
    )
    
    data class Parent(
        val groupId: String? = null,
        val artifactId: String? = null,
        val version: String? = null
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