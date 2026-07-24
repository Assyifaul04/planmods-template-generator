// lib/templates-generator/fabric/placeholder-replacer.ts
import { GeneratorData } from "./helpers";

// ✅ SINKRON DENGAN scripts/fetch-minecraft-versions.ts
const FABRIC_LOOM_VERSIONS: Record<string, string> = {
  '1.21': '1.11.7',
  '1.21.1': '1.11.7',
  '1.21.2': '1.11.7',
  '1.21.3': '1.11.7',
  '1.21.4': '1.11.7',
  '1.21.5': '1.11.7',
  '1.21.6': '1.11.7',
  '1.21.7': '1.11.7',
  '1.21.8': '1.11.7',
  '1.21.9': '1.11.7',
  '1.21.10': '1.11.7',
  '1.21.11': '1.11.7',
  '1.20': '1.7.4',
  '1.20.1': '1.7.4',
  '1.20.2': '1.7.4',
  '1.20.3': '1.7.4',
  '1.20.4': '1.7.4',
  '1.20.5': '1.7.4',
  '1.20.6': '1.7.4',
  '1.19': '1.6.12',
  '1.19.1': '1.6.12',
  '1.19.2': '1.6.12',
  '1.19.3': '1.6.12',
  '1.19.4': '1.6.12',
  '1.18': '1.5.14',
  '1.18.1': '1.5.14',
  '1.18.2': '1.5.14',
  '1.17': '1.4.12',
  '1.17.1': '1.4.12',
  '1.16': '1.3.11',
  '1.16.1': '1.3.11',
  '1.16.2': '1.3.11',
  '1.16.3': '1.3.11',
  '1.16.4': '1.3.11',
  '1.16.5': '1.3.11',
  'default': '1.7.4',
};

function getLoomVersion(mcVersion: string): string {
  for (const [prefix, version] of Object.entries(FABRIC_LOOM_VERSIONS)) {
    if (mcVersion.startsWith(prefix)) {
      return version;
    }
  }
  return FABRIC_LOOM_VERSIONS['default'];
}

export function replacePlaceholders(content: string, data: GeneratorData): string {
  if (typeof content !== 'string' || content.length > 500000) {
    return String(content);
  }
  
  let result = content;
  
  const modId = data?.modId || "examplemod";
  const packageName = data?.packageName || "com.example.mod";
  const className = data?.className || "ExampleMod";
  const clientClassName = data?.clientClassName || "ExampleModClient";
  const name = data?.name || "Project";
  const slug = data?.slug || "project";
  const author = data?.author || "Unknown";
  const version = data?.version || "1.0.0";
  const minecraftVersion = data?.minecraftVersion || "1.20.4";
  const loaderVersion = data?.loaderVersion || "0.16.9";
  const javaVersion = data?.javaVersion || "17";
  const gradleVersion = data?.gradleVersion || "8.5";
  const fabricApiVersion = data?.fabricApiVersion || "0.91.1+1.20.4";
  const loomVersion = data?.loomVersion || getLoomVersion(minecraftVersion);
  // ✅ Default mappings version disesuaikan dengan format & nilai default di fetch-minecraft-versions.ts
  const mappingsVersion = data?.mappingsVersion || "1.20.4+build.3";
  
  const classPrefix = modId.charAt(0).toUpperCase() + modId.slice(1);
  const projectNameCapitalized = name.charAt(0).toUpperCase() + name.slice(1);
  const packagePath = packageName.replace(/\./g, '/');

  const replacements: Record<string, string> = {
    '{{packageName}}': packageName,
    '{{package_name}}': packageName,
    '{{PACKAGE_NAME}}': packageName.toUpperCase(),
    '{{modId}}': modId,
    '{{mod_id}}': modId,
    '{{MOD_ID}}': modId.toUpperCase(),
    '{{ModId}}': classPrefix,
    '{{className}}': className,
    '{{class_name}}': className,
    '{{CLASS_NAME}}': className.toUpperCase(),
    '{{clientClassName}}': clientClassName,
    '{{client_class_name}}': clientClassName,
    '{{ExampleMod}}': className,
    '{{ExampleModClient}}': clientClassName,
    '{{examplemod}}': modId,
    '{{EXAMPLEMOD}}': modId.toUpperCase(),
    '{{projectName}}': name,
    '{{project_name}}': name,
    '{{projectSlug}}': slug,
    '{{project_slug}}': slug,
    '{{ProjectName}}': projectNameCapitalized,
    '{{author}}': author,
    '{{Author}}': author,
    '{{version}}': version,
    '{{Version}}': version,
    '{{VERSION}}': version,
    '{{minecraftVersion}}': minecraftVersion,
    '{{minecraft_version}}': minecraftVersion,
    '{{MC_VERSION}}': minecraftVersion,
    '{{loaderVersion}}': loaderVersion,
    '{{loader_version}}': loaderVersion,
    '{{LOADER_VERSION}}': loaderVersion,
    '{{javaVersion}}': javaVersion,
    '{{java_version}}': javaVersion,
    '{{JAVA_VERSION}}': javaVersion,
    '{{gradleVersion}}': gradleVersion,
    '{{gradle_version}}': gradleVersion,
    '{{GRADLE_VERSION}}': gradleVersion,
    '{{fabricApiVersion}}': fabricApiVersion,
    '{{fabric_api_version}}': fabricApiVersion,
    '{{FABRIC_API_VERSION}}': fabricApiVersion,
    '{{loomVersion}}': loomVersion,
    '{{loom_version}}': loomVersion,
    '{{LOOM_VERSION}}': loomVersion,
    '{{mappingsVersion}}': mappingsVersion,
    '{{mappings_version}}': mappingsVersion,
    '{{MAPPINGS_VERSION}}': mappingsVersion,
    '{{year}}': new Date().getFullYear().toString(),
    '{{YEAR}}': new Date().getFullYear().toString(),
    '{{packagePath}}': packagePath,
    '{{package_path}}': packagePath,
    '{{loaderAnnotation}}': '@Mod',
    '{{initializerInterface}}': 'ModInitializer',
    '{{clientInitializerInterface}}': 'ClientModInitializer',
    '{{entrypointMain}}': 'main',
    '{{entrypointClient}}': 'client',
    '{{mainClass}}': 'net.minecraft.client.main.Main',
    '{{serverClass}}': 'net.minecraft.server.MinecraftServer',
  };

  Object.entries(replacements).forEach(([key, value]) => {
    try {
      result = result.replace(new RegExp(key, 'g'), value);
    } catch (e) {}
  });

  try {
    // Class paths
    result = result.replace(/com\.example\.mod\.ExampleModClient/g, `${packageName}.${clientClassName}`);
    result = result.replace(/com\.example\.mod\.ExampleMod/g, `${packageName}.${className}`);
    result = result.replace(/net\.fabricmc\.example\.ExampleMod/g, `${packageName}.${className}`);
    result = result.replace(/com\/example\/mod/g, packagePath);
    result = result.replace(/com\.example\.mod/g, packageName);
    result = result.replace(/com\/example/g, packagePath);
    result = result.replace(/com\.example/g, packageName);
    result = result.replace(/net\/fabricmc\/example/g, packagePath);
    result = result.replace(/net\.fabricmc\.example/g, packageName);
    result = result.replace(/ExampleModClient/g, clientClassName);
    result = result.replace(/ExampleMod/g, className);
    result = result.replace(/Example/g, classPrefix);
    result = result.replace(/modid/g, modId);
    result = result.replace(/mod_id/g, modId);
    result = result.replace(/MODID/g, modId.toUpperCase());
    result = result.replace(/examplemod/g, modId);
    result = result.replace(/EXAMPLEMOD/g, modId.toUpperCase());
    result = result.replace(new RegExp(`import ${packageName}\\.mod\\.`, 'g'), `import ${packageName}.`);
    result = result.replace(/@Mixin\(ExampleMod\.class\)/g, `@Mixin(${className}.class)`);
    result = result.replace(/@Mixin\(ExampleModClient\.class\)/g, `@Mixin(${clientClassName}.class)`);
    result = result.replace(/"examplemod"/g, `"${modId}"`);
    result = result.replace(/'examplemod'/g, `'${modId}'`);
    result = result.replace(/`examplemod`/g, `\`${modId}\``);
    result = result.replace(/"Example Mod"/g, `"${name}"`);
    result = result.replace(/'Example Mod'/g, `'${name}'`);
    result = result.replace(/@Mod\(["']examplemod["']\)/g, `@Mod("${modId}")`);
    result = result.replace(/@Mod\(["']modid["']\)/g, `@Mod("${modId}")`);
    result = result.replace(/"id":\s*"modid"/g, `"id": "${modId}"`);
    result = result.replace(/"id":\s*"examplemod"/g, `"id": "${modId}"`);

    // ✅ Replace Loom version di build.gradle
    if (loomVersion) {
      result = result.replace(
        /id\s+['"]fabric-loom['"]\s+version\s+['"][^'"]+['"]/g,
        `id 'fabric-loom' version '${loomVersion}'`
      );
    }

    // ✅ Replace untuk build.gradle
    if (minecraftVersion) {
      result = result.replace(
        /minecraft\s+["']com\.mojang:minecraft:[^"']+["']/g,
        `minecraft "com.mojang:minecraft:${minecraftVersion}"`
      );
    }

    if (loaderVersion) {
      result = result.replace(
        /modImplementation\s+["']net\.fabricmc:fabric-loader:[^"']+["']/g,
        `modImplementation "net.fabricmc:fabric-loader:${loaderVersion}"`
      );
    }

    if (fabricApiVersion) {
      result = result.replace(
        /modImplementation\s+["']net\.fabricmc\.fabric-api:fabric-api:[^"']+["']/g,
        `modImplementation "net.fabricmc.fabric-api:fabric-api:${fabricApiVersion}"`
      );
    }

    // ✅ Replace untuk gradle.properties
    if (minecraftVersion) {
      result = result.replace(/^[\s]*minecraft_version\s*=\s*.*$/gm, `    minecraft_version=${minecraftVersion}`);
    }
    if (loaderVersion) {
      result = result.replace(/^[\s]*loader_version\s*=\s*.*$/gm, `    loader_version=${loaderVersion}`);
    }
    if (fabricApiVersion) {
      result = result.replace(/^[\s]*fabric_api_version\s*=\s*.*$/gm, `    fabric_api_version=${fabricApiVersion}`);
    }
    if (version) {
      result = result.replace(/^[\s]*mod_version\s*=\s*.*$/gm, `    mod_version=${version}`);
    }
    if (packageName) {
      result = result.replace(/^[\s]*maven_group\s*=\s*.*$/gm, `    maven_group=${packageName}`);
    }
    if (mappingsVersion) {
      result = result.replace(/^[\s]*mapping_version\s*=\s*.*$/gm, `    mapping_version=${mappingsVersion}`);
    }

    // Java version
    if (javaVersion) {
        result = result.replace(/"compatibilityLevel":\s*"JAVA_\d+"/g, `"compatibilityLevel": "JAVA_${javaVersion}"`);
        result = result.replace(/JavaVersion\.VERSION_\d+/g, `JavaVersion.VERSION_${javaVersion}`);
        result = result.replace(/release\s*=\s*\d+/g, `release = ${javaVersion}`);
        result = result.replace(/sourceCompatibility\s*=\s*['"]?(?:1\.)?\d+['"]?/g, `sourceCompatibility = JavaVersion.VERSION_${javaVersion}`);
        result = result.replace(/targetCompatibility\s*=\s*['"]?(?:1\.)?\d+['"]?/g, `targetCompatibility = JavaVersion.VERSION_${javaVersion}`);
        result = result.replace(/java-version:\s*['"]?\d+['"]?/g, `java-version: '${javaVersion}'`);
        result = result.replace(/distribution:\s*['"]?[a-zA-Z]+['"]?/g, `distribution: 'microsoft'`);
    }

    if (gradleVersion) {
        result = result.replace(/gradle-[\d.]+-bin\.zip/g, `gradle-${gradleVersion}-bin.zip`);
    }

    // Update actions version
    result = result.replace(/actions\/checkout@v\d+/g, 'actions/checkout@v4');
    result = result.replace(/actions\/setup-java@v\d+/g, 'actions/setup-java@v4');
    result = result.replace(/gradle\/actions\/wrapper-validation@v\d+/g, 'gradle/actions/wrapper-validation@v3');
    result = result.replace(/actions\/upload-artifact@v\d+/g, 'actions/upload-artifact@v4');

    // fabric.mod.json
    if (loaderVersion) result = result.replace(/"fabricloader":\s*">=.*?"/g, `"fabricloader": ">=${loaderVersion}"`);
    if (minecraftVersion) result = result.replace(/"minecraft":\s*"~.*?"/g, `"minecraft": "~${minecraftVersion}"`);
    if (javaVersion) result = result.replace(/"java":\s*">=.*?"/g, `"java": ">=${javaVersion}"`);
  } catch (e) {
    console.warn("Warning: Error in replacement processing:", e);
  }

  return result;
}