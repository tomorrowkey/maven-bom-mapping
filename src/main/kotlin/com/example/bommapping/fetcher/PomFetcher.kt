package com.example.bommapping.fetcher

import okhttp3.OkHttpClient
import okhttp3.Request
import org.slf4j.LoggerFactory
import java.io.File

class PomFetcher(
    private val mavenRepository: String = "https://repo1.maven.org/maven2/"
) {
    private val logger = LoggerFactory.getLogger(PomFetcher::class.java)
    private val client = OkHttpClient()
    
    fun downloadPom(groupId: String, artifactId: String, version: String): String {
        val url = buildPomUrl(groupId, artifactId, version)
        logger.info("Downloading POM from: $url")
        
        val request = Request.Builder()
            .url(url)
            .build()
        
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw PomFetchException("Failed to download POM: ${response.code} ${response.message}")
            }
            
            return response.body?.string() 
                ?: throw PomFetchException("Empty response body")
        }
    }
    
    fun downloadPomToFile(groupId: String, artifactId: String, version: String, targetFile: File): File {
        val pomContent = downloadPom(groupId, artifactId, version)
        targetFile.parentFile?.mkdirs()
        targetFile.writeText(pomContent)
        logger.info("POM saved to: ${targetFile.absolutePath}")
        return targetFile
    }
    
    private fun buildPomUrl(groupId: String, artifactId: String, version: String): String {
        val groupPath = groupId.replace('.', '/')
        return "$mavenRepository$groupPath/$artifactId/$version/$artifactId-$version.pom"
    }
}

class PomFetchException(message: String) : Exception(message)