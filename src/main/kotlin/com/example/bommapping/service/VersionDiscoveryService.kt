package com.example.bommapping.service

import okhttp3.OkHttpClient
import okhttp3.Request
import org.slf4j.LoggerFactory
import java.io.IOException
import java.time.Duration

class VersionDiscoveryService(
    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(Duration.ofSeconds(30))
        .readTimeout(Duration.ofSeconds(60))
        .build()
) {
    private val logger = LoggerFactory.getLogger(VersionDiscoveryService::class.java)
    
    /**
     * Discover all available versions for a given artifact from Maven repository
     */
    fun discoverVersions(baseUrl: String, groupId: String, artifactId: String): List<String> {
        val metadataUrl = buildMetadataUrl(baseUrl, groupId, artifactId)
        
        return try {
            val request = Request.Builder()
                .url(metadataUrl)
                .build()

            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    logger.error("Failed to fetch metadata from $metadataUrl: ${response.code}")
                    return emptyList()
                }

                val body = response.body?.string() ?: return emptyList()
                parseVersionsFromMetadata(body)
            }
        } catch (e: IOException) {
            logger.error("Error fetching versions for $groupId:$artifactId: ${e.message}")
            emptyList()
        }
    }
    
    private fun buildMetadataUrl(baseUrl: String, groupId: String, artifactId: String): String {
        val groupPath = groupId.replace('.', '/')
        return "${baseUrl.trimEnd('/')}/$groupPath/$artifactId/maven-metadata.xml"
    }
    
    private fun parseVersionsFromMetadata(xml: String): List<String> {
        val versions = mutableListOf<String>()
        
        // Simple XML parsing to extract versions
        val versionPattern = Regex("<version>([^<]+)</version>")
        versionPattern.findAll(xml).forEach { matchResult ->
            val version = matchResult.groupValues[1].trim()
            if (version.isNotEmpty() && !version.contains("SNAPSHOT")) {
                versions.add(version)
            }
        }
        
        // Sort versions in natural order (this is basic, could be improved with proper version comparison)
        return versions.distinct().sorted()
    }
}