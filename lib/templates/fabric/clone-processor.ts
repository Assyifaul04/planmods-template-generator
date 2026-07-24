// lib/templates/fabric/clone-processor.ts
import fs from "fs";
import path from "path";
import {
  generateBuildGradle,
  generateGradleProperties,
  generateFabricModJson,
  generateGitignore,
  generateGitattributes,
  generateLicense,
  generateReadme,
  generateSettingsGradle,
  generateGradleWrapperProperties,
  generateExampleModJava,
  generateExampleModClientJava,
  generateBuildYml,
} from "./file-generator";
import { GRADLEW_BAT_CONTENT, GRADLEW_CONTENT } from "./gradle-files";

export interface CloneProcessorOptions {
  templatePath: string;
  templateName: string;
  minecraftVersion: string;
  loaderVersion: string;
  platform: string;
  loader: string;
}

/**
 * Proses hasil clone dari GitHub agar sesuai dengan versi yang dipilih
 * - Mengganti file build.gradle, gradle.properties, fabric.mod.json
 * - Menambahkan file yang hilang (gradlew, gradlew.bat, dll)
 * - Membersihkan file yang tidak perlu (build cache, .git, dll)
 */
export function processClonedTemplate(options: CloneProcessorOptions): {
  success: boolean;
  modifiedFiles: string[];
  addedFiles: string[];
  removedFiles: string[];
  message: string;
} {
  const { templatePath, templateName, minecraftVersion, loaderVersion, platform, loader } = options;

  const modifiedFiles: string[] = [];
  const addedFiles: string[] = [];
  const removedFiles: string[] = [];

  // ============================================
  // 1. HAPUS FILE DAN FOLDER YANG TIDAK PERLU
  // ============================================
  const unwantedItems = [
    ".git",
    "build",
    ".gradle",
    "out",
    "logs",
    "run",
    "loom-cache",
    "VCS-1",
    "bin",
    ".idea",
    ".vscode",
    ".settings",
    ".project",
    ".classpath",
    "*.iml",
    "*.iws",
    "*.ipr",
  ];

  unwantedItems.forEach(item => {
    const itemPath = path.join(templatePath, item);
    if (fs.existsSync(itemPath)) {
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(itemPath);
      }
      removedFiles.push(item);
    }
  });

  // Hapus file-file cache/binary besar
  const binaryCacheFiles = [
    "md5-checksums.bin",
    "sha1-checksums.bin",
    "last-build.bin",
    "fileHashes.bin",
    "minecraft-clientOnly-*.jar",
    "minecraft-common-*.jar",
    "gradle-wrapper.jar",
  ];

  const allFiles = fs.readdirSync(templatePath);
  allFiles.forEach(file => {
    binaryCacheFiles.forEach(pattern => {
      if (pattern.includes("*")) {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        if (regex.test(file)) {
          const filePath = path.join(templatePath, file);
          fs.unlinkSync(filePath);
          removedFiles.push(file);
        }
      } else if (file === pattern) {
        const filePath = path.join(templatePath, file);
        fs.unlinkSync(filePath);
        removedFiles.push(file);
      }
    });
  });

  // ============================================
  // 2. BUAT ULANG FILE-FILE PENTING
  // ============================================

  // 2a. build.gradle
  const buildGradlePath = path.join(templatePath, "build.gradle");
  if (fs.existsSync(buildGradlePath)) {
    fs.unlinkSync(buildGradlePath);
    removedFiles.push("build.gradle");
  }
  const buildGradleContent = generateBuildGradle(minecraftVersion, loaderVersion);
  fs.writeFileSync(buildGradlePath, buildGradleContent);
  modifiedFiles.push("build.gradle");

  // 2b. gradle.properties
  const gradlePropertiesPath = path.join(templatePath, "gradle.properties");
  if (fs.existsSync(gradlePropertiesPath)) {
    fs.unlinkSync(gradlePropertiesPath);
    removedFiles.push("gradle.properties");
  }
  const gradlePropertiesContent = generateGradleProperties(minecraftVersion, loaderVersion);
  fs.writeFileSync(gradlePropertiesPath, gradlePropertiesContent);
  modifiedFiles.push("gradle.properties");

  // 2c. settings.gradle
  const settingsGradlePath = path.join(templatePath, "settings.gradle");
  if (!fs.existsSync(settingsGradlePath)) {
    const settingsGradleContent = generateSettingsGradle();
    fs.writeFileSync(settingsGradlePath, settingsGradleContent);
    addedFiles.push("settings.gradle");
  }

  // 2d. gradle/wrapper/gradle-wrapper.properties
  const wrapperDir = path.join(templatePath, "gradle", "wrapper");
  if (!fs.existsSync(wrapperDir)) {
    fs.mkdirSync(wrapperDir, { recursive: true });
  }
  const wrapperPropertiesPath = path.join(wrapperDir, "gradle-wrapper.properties");
  if (fs.existsSync(wrapperPropertiesPath)) {
    fs.unlinkSync(wrapperPropertiesPath);
    removedFiles.push("gradle/wrapper/gradle-wrapper.properties");
  }
  const wrapperPropertiesContent = generateGradleWrapperProperties();
  fs.writeFileSync(wrapperPropertiesPath, wrapperPropertiesContent);
  addedFiles.push("gradle/wrapper/gradle-wrapper.properties");

  // 2e. .gitignore
  const gitignorePath = path.join(templatePath, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    fs.unlinkSync(gitignorePath);
    removedFiles.push(".gitignore");
  }
  const gitignoreContent = generateGitignore();
  fs.writeFileSync(gitignorePath, gitignoreContent);
  modifiedFiles.push(".gitignore");

  // 2f. .gitattributes
  const gitattributesPath = path.join(templatePath, ".gitattributes");
  if (fs.existsSync(gitattributesPath)) {
    fs.unlinkSync(gitattributesPath);
    removedFiles.push(".gitattributes");
  }
  const gitattributesContent = generateGitattributes();
  fs.writeFileSync(gitattributesPath, gitattributesContent);
  modifiedFiles.push(".gitattributes");

  // 2g. LICENSE
  const licensePath = path.join(templatePath, "LICENSE");
  if (!fs.existsSync(licensePath)) {
    const licenseContent = generateLicense(new Date().getFullYear());
    fs.writeFileSync(licensePath, licenseContent);
    addedFiles.push("LICENSE");
  }

  // 2h. README.md
  const readmePath = path.join(templatePath, "README.md");
  if (fs.existsSync(readmePath)) {
    fs.unlinkSync(readmePath);
    removedFiles.push("README.md");
  }
  const readmeContent = generateReadme(templateName);
  fs.writeFileSync(readmePath, readmeContent);
  modifiedFiles.push("README.md");

  // 2i. fabric.mod.json
  const resourcesPath = path.join(templatePath, "src", "main", "resources");
  if (!fs.existsSync(resourcesPath)) {
    fs.mkdirSync(resourcesPath, { recursive: true });
  }
  const fabricModJsonPath = path.join(resourcesPath, "fabric.mod.json");
  if (fs.existsSync(fabricModJsonPath)) {
    fs.unlinkSync(fabricModJsonPath);
    removedFiles.push("src/main/resources/fabric.mod.json");
  }
  const fabricModJsonContent = generateFabricModJson();
  fs.writeFileSync(fabricModJsonPath, fabricModJsonContent);
  addedFiles.push("src/main/resources/fabric.mod.json");

  // 2j. ExampleMod.java (pastikan ada)
  const mainJavaPath = path.join(templatePath, "src", "main", "java", "com", "example", "mod");
  if (!fs.existsSync(mainJavaPath)) {
    fs.mkdirSync(mainJavaPath, { recursive: true });
  }
  const exampleModPath = path.join(mainJavaPath, "ExampleMod.java");
  if (!fs.existsSync(exampleModPath)) {
    const exampleModContent = generateExampleModJava();
    fs.writeFileSync(exampleModPath, exampleModContent);
    addedFiles.push("src/main/java/com/example/mod/ExampleMod.java");
  }

  // 2k. ExampleModClient.java (pastikan ada)
  const clientJavaPath = path.join(templatePath, "src", "client", "java", "com", "example", "mod");
  if (!fs.existsSync(clientJavaPath)) {
    fs.mkdirSync(clientJavaPath, { recursive: true });
  }
  const exampleModClientPath = path.join(clientJavaPath, "ExampleModClient.java");
  if (!fs.existsSync(exampleModClientPath)) {
    const exampleModClientContent = generateExampleModClientJava();
    fs.writeFileSync(exampleModClientPath, exampleModClientContent);
    addedFiles.push("src/client/java/com/example/mod/ExampleModClient.java");
  }

  // 2l. .github/workflows/build.yml
  const workflowsPath = path.join(templatePath, ".github", "workflows");
  if (!fs.existsSync(workflowsPath)) {
    fs.mkdirSync(workflowsPath, { recursive: true });
  }
  const buildYmlPath = path.join(workflowsPath, "build.yml");
  if (!fs.existsSync(buildYmlPath)) {
    const buildYmlContent = generateBuildYml();
    fs.writeFileSync(buildYmlPath, buildYmlContent);
    addedFiles.push(".github/workflows/build.yml");
  }

  // ============================================
  // 3. TAMBAHKAN GRADLEW DAN GRADLEW.BAT
  // ============================================
  const gradlewPath = path.join(templatePath, "gradlew");
  if (!fs.existsSync(gradlewPath)) {
    fs.writeFileSync(gradlewPath, GRADLEW_CONTENT);
    fs.chmodSync(gradlewPath, 0o755);
    addedFiles.push("gradlew");
  }

  const gradlewBatPath = path.join(templatePath, "gradlew.bat");
  if (!fs.existsSync(gradlewBatPath)) {
    fs.writeFileSync(gradlewBatPath, GRADLEW_BAT_CONTENT);
    addedFiles.push("gradlew.bat");
  }

  // ============================================
  // 4. LOG HASIL
  // ============================================
  console.log(`✅ Processed cloned template at: ${templatePath}`);
  console.log(`   📝 Modified: ${modifiedFiles.length} files`);
  console.log(`   ➕ Added: ${addedFiles.length} files`);
  console.log(`   ❌ Removed: ${removedFiles.length} files`);

  return {
    success: true,
    modifiedFiles,
    addedFiles,
    removedFiles,
    message: `Template processed successfully for Minecraft ${minecraftVersion}`,
  };
}