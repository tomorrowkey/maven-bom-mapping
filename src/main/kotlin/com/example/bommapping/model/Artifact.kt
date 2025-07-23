package com.example.bommapping.model

data class Artifact(
    val groupId: String,
    val artifactId: String,
    val version: String
) {
    val coordinates: String
        get() = "$groupId:$artifactId:$version"
    
    override fun toString(): String = coordinates
}