package com.example.bommapping.config

import com.example.bommapping.model.BomConfig
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory
import com.fasterxml.jackson.module.kotlin.readValue
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import java.io.File

class ConfigLoader {
    private val mapper = ObjectMapper(YAMLFactory()).registerKotlinModule()
    
    fun load(configFile: File): BomConfig {
        require(configFile.exists()) { "Config file not found: ${configFile.absolutePath}" }
        require(configFile.extension == "yaml" || configFile.extension == "yml") {
            "Config file must be a YAML file"
        }
        
        return mapper.readValue(configFile)
    }
    
    fun load(configPath: String = "config.yaml"): BomConfig {
        return load(File(configPath))
    }
}