package com.example.bommapping.cli

import com.github.ajalt.clikt.core.CliktCommand

class BomMappingCli : CliktCommand(
    name = "bom-mapping",
    help = "Maven BOM comparison tool"
) {
    override fun run() = Unit
}