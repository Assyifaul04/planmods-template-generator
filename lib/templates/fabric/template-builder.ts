// lib/templates/fabric/template-builder.ts
import fs from "fs";
import path from "path";
import {
  generateBuildGradle,
  generateGradleProperties,
  generateSettingsGradle,
  generateGradleWrapperProperties,
  generateGitignore,
  generateGitattributes,
  generateLicense,
  generateReadme,
  generateFabricModJson,
  generateExampleModJava,
  generateExampleModClientJava,
  generateBuildYml,
} from "./file-generator";
import { GRADLEW_BAT_CONTENT, GRADLEW_CONTENT } from "./gradle-files";

export interface FabricTemplateOptions {
  templateName: string;
  minecraftVersion: string;
  loaderVersion?: string;
  outputPath: string;
}

export function createFabricTemplateStructure(options: FabricTemplateOptions): string[] {
  const { templateName, minecraftVersion, loaderVersion = "0.16.9", outputPath } = options;

  // Buat folder
  const folders = [
    "src/main/java/com/example/mod",
    "src/client/java/com/example/mod",
    "gradle/wrapper",
    ".github/workflows",
  ];

  folders.forEach(folder => {
    const fullPath = path.join(outputPath, folder);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  const files: Record<string, string> = {
    "build.gradle": generateBuildGradle(minecraftVersion, loaderVersion),
    "gradle.properties": generateGradleProperties(minecraftVersion, loaderVersion),
    "settings.gradle": generateSettingsGradle(),
    "gradle/wrapper/gradle-wrapper.properties": generateGradleWrapperProperties(),
    ".gitignore": generateGitignore(),
    ".gitattributes": generateGitattributes(),
    "LICENSE": generateLicense(new Date().getFullYear()),
    "README.md": generateReadme(templateName),
    "src/main/resources/fabric.mod.json": generateFabricModJson(),
    "src/main/java/com/example/mod/ExampleMod.java": generateExampleModJava(),
    "src/client/java/com/example/mod/ExampleModClient.java": generateExampleModClientJava(),
    ".github/workflows/build.yml": generateBuildYml(),
  };

  // ✅ TAMBAHKAN GRADLEW DAN GRADLEW.BAT
  const gradleFiles: Record<string, string> = {
    "gradlew": GRADLEW_CONTENT,
    "gradlew.bat": GRADLEW_BAT_CONTENT,
  };

  // Tulis semua file
  const createdFiles: string[] = [];
  
  Object.entries({ ...files, ...gradleFiles }).forEach(([relativePath, content]) => {
    const fullPath = path.join(outputPath, relativePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content, "utf8");
    createdFiles.push(relativePath);
  });

  // Set executable permission untuk gradlew (Unix/Linux/Mac)
  const gradlewPath = path.join(outputPath, "gradlew");
  if (fs.existsSync(gradlewPath)) {
    try {
      fs.chmodSync(gradlewPath, 0o755);
    } catch (error) {
      console.warn("Could not set executable permission for gradlew:", error);
    }
  }

  return createdFiles;
}

export function getFabricTemplateFiles(): string[] {
  return [
    "build.gradle",
    "gradle.properties",
    "settings.gradle",
    "gradle/wrapper/gradle-wrapper.properties",
    "gradlew",
    "gradlew.bat",
    ".gitignore",
    ".gitattributes",
    "LICENSE",
    "README.md",
    "src/main/resources/fabric.mod.json",
    "src/main/java/com/example/mod/ExampleMod.java",
    "src/client/java/com/example/mod/ExampleModClient.java",
    ".github/workflows/build.yml",
  ];
}