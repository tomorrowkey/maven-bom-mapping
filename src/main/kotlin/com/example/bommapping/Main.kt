package com.example.bommapping

import com.example.bommapping.cli.BomMappingCli
import com.github.ajalt.clikt.core.subcommands

fun main(args: Array<String>) {
    BomMappingCli()
        .subcommands(
            com.example.bommapping.cli.GenerateCommand()
        )
        .main(args)
}