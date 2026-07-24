// lib/templates/fabric/file-generator.ts
import fs from "fs";
import path from "path";
import { GRADLEW_BAT_CONTENT, GRADLEW_CONTENT } from "./gradle-files";

interface FabricTemplateOptions {
  templateName: string;
  minecraftVersion: string;
  loaderVersion: string;
  outputPath: string;
  packageName?: string;
  modId?: string;
  author?: string;
  version?: string;
}

export function generateBuildGradle(mcVersion: string, loaderVer: string): string {
  return `plugins {
    id 'fabric-loom' version '1.6-SNAPSHOT'
    id 'maven-publish'
}

version = project.mod_version
group = project.maven_group

repositories {
    mavenCentral()
    maven {
        name = 'Fabric'
        url = 'https://maven.fabricmc.net/'
    }
}

dependencies {
    minecraft "com.mojang:minecraft:${mcVersion}"
    mappings loom.layered() {
        officialMojangMappings()
    }
    modImplementation "net.fabricmc:fabric-loader:${loaderVer}"
    modImplementation "net.fabricmc.fabric-api:fabric-api:0.91.1+1.20.4"
}

processResources {
    inputs.property "version", project.version
    inputs.property "minecraft_version", project.minecraft_version
    inputs.property "loader_version", project.loader_version
    filteringCharset "UTF-8"

    filesMatching("fabric.mod.json") {
        expand "version": project.version,
                "minecraft_version": project.minecraft_version,
                "loader_version": project.loader_version
    }
}

tasks.withType(JavaCompile).configureEach {
    it.options.encoding = "UTF-8"
    it.options.release = 21
}

java {
    withSourcesJar()
}

jar {
    from("LICENSE") {
        rename { "\${it}_\${project.archivesBaseName}"}
    }
}

publishing {
    publications {
        mavenJava(MavenPublication) {
            from components.java
        }
    }
}`;
}

export function generateGradleProperties(mcVersion: string, loaderVer: string): string {
  return `# Done to increase the memory available to gradle.
org.gradle.jvmargs=-Xmx2G

# Fabric Properties
    minecraft_version=${mcVersion}
    loader_version=${loaderVer}
    fabric_api_version=0.91.1+1.20.4

# Mod Properties
    mod_version=1.0.0
    maven_group=com.example.mod
    archives_base_name=examplemod

# Dependencies
    fabric_loader_version=${loaderVer}
`;
}

export function generateSettingsGradle(): string {
  return `pluginManagement {
    repositories {
        maven {
            name = 'Fabric'
            url = 'https://maven.fabricmc.net/'
        }
        mavenCentral()
        gradlePluginPortal()
    }
}`;
}

export function generateGradleWrapperProperties(): string {
  return `distributionUrl=https\\://services.gradle.org/distributions/gradle-8.11-bin.zip
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`;
}

export function generateGitignore(): string {
  return `# Gradle
.gradle/
build/
out/
logs/

# Eclipse
.classpath
.project
.settings/
bin/

# IntelliJ
.idea/
*.iml
*.iws
*.ipr
out/

# Mac
.DS_Store

# Fabric
run/`;
}

export function generateGitattributes(): string {
  return `# Auto detect text files and perform LF normalization
* text=auto

# Source code
*.java text diff=java
*.gradle text
*.properties text

# Binaries
*.jar binary
*.png binary
*.jpg binary
*.ogg binary`;
}

export function generateLicense(year: number): string {
  return `MIT License

Copyright (c) ${year} Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
}

export function generateReadme(templateName: string): string {
  return `# ${templateName}

A Minecraft mod built with Fabric.

## Development

### Setup

1. Clone the repository
2. Run \`./gradlew build\` to build the mod
3. Run \`./gradlew runClient\` to start Minecraft with the mod

### Requirements

- Java 21
- Gradle 8.11

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.`;
}

export function generateFabricModJson(): string {
  return `{
  "schemaVersion": 1,
  "id": "examplemod",
  "version": "\${version}",
  "name": "Example Mod",
  "description": "An example mod built with Fabric",
  "authors": ["Your Name"],
  "contact": {
    "homepage": "https://example.com/",
    "sources": "https://github.com/yourusername/examplemod"
  },
  "license": "MIT",
  "icon": "assets/examplemod/icon.png",
  "environment": "*",
  "entrypoints": {
    "main": [
      "com.example.mod.ExampleMod"
    ],
    "client": [
      "com.example.mod.ExampleModClient"
    ]
  },
  "mixins": [],
  "depends": {
    "fabricloader": ">=\${loader_version}",
    "minecraft": "~\${minecraft_version}",
    "fabric-api": "*"
  }
}`;
}

export function generateExampleModJava(): string {
  return `package com.example.mod;

import net.fabricmc.api.ModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ExampleMod implements ModInitializer {
    public static final String MOD_ID = "examplemod";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("Hello from Example Mod!");
    }
}`;
}

export function generateExampleModClientJava(): string {
  return `package com.example.mod;

import net.fabricmc.api.ClientModInitializer;

public class ExampleModClient implements ClientModInitializer {
    @Override
    public void onInitializeClient() {
        // Client-side initialization code here
    }
}`;
}

export function generateBuildYml(): string {
  return `name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      - name: Make gradlew executable
        run: chmod +x ./gradlew
      - name: Build with Gradle
        run: ./gradlew build
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: build/libs/`;
}