// lib/templates-generator/fabric/generator.ts
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import {
  slugify,
  ensureDirectoryExists,
  getTemplatePath,
  GeneratorData,
  FileNode,
  execAsync,
} from "./helpers";
import { copyAndProcessFiles } from "./file-processor";

// ✅ FABRIC LOOM VERSIONS - SINKRON DENGAN DATA RESMI (TERBARU)
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

// ✅ FABRIC API VERSIONS - LENGKAP & SINKRON
const FABRIC_API_VERSIONS: Record<string, string> = {
  '1.21.11': '0.135.2+1.21.11',
  '1.21.10': '0.106.1+1.21.10',
  '1.21.9': '0.106.1+1.21.9',
  '1.21.8': '0.106.1+1.21.8',
  '1.21.7': '0.106.1+1.21.7',
  '1.21.6': '0.106.1+1.21.6',
  '1.21.5': '0.106.1+1.21.5',
  '1.21.4': '0.106.1+1.21.4',
  '1.21.3': '0.106.1+1.21.3',
  '1.21.2': '0.106.1+1.21.2',
  '1.21.1': '0.106.1+1.21.1',
  '1.21': '0.106.1+1.21',
  '1.20.6': '0.97.0+1.20.6',
  '1.20.5': '0.97.0+1.20.5',
  '1.20.4': '0.97.0+1.20.4',
  '1.20.3': '0.95.0+1.20.3',
  '1.20.2': '0.94.0+1.20.2',
  '1.20.1': '0.91.1+1.20.1',
  '1.20': '0.90.0+1.20',
  '1.19.4': '0.87.1+1.19.4',
  '1.19.3': '0.83.0+1.19.3',
  '1.19.2': '0.76.1+1.19.2',
  '1.19.1': '0.74.0+1.19.1',
  '1.19': '0.72.0+1.19',
  '1.18.2': '0.67.1+1.18.2',
  '1.18.1': '0.60.0+1.18.1',
  '1.18': '0.59.0+1.18',
  '1.17.1': '0.46.1+1.17.1',
  '1.17': '0.43.0+1.17',
  '1.16.5': '0.34.1+1.16.5',
  'default': '0.91.1+1.20.4',
};

// ✅ MAPPINGS VERSIONS - LENGKAP
const MAPPINGS_VERSIONS: Record<string, string> = {
  '1.21.11': '1.21.11+build.1',
  '1.21.10': '1.21.10+build.1',
  '1.21.9': '1.21.9+build.1',
  '1.21.8': '1.21.8+build.1',
  '1.21.7': '1.21.7+build.1',
  '1.21.6': '1.21.6+build.1',
  '1.21.5': '1.21.5+build.1',
  '1.21.4': '1.21.4+build.1',
  '1.21.3': '1.21.3+build.1',
  '1.21.2': '1.21.2+build.1',
  '1.21.1': '1.21.1+build.3',
  '1.21': '1.21+build.1',
  '1.20.6': '1.20.6+build.1',
  '1.20.5': '1.20.5+build.1',
  '1.20.4': '1.20.4+build.3',
  '1.20.3': '1.20.3+build.1',
  '1.20.2': '1.20.2+build.1',
  '1.20.1': '1.20.1+build.10',
  '1.20': '1.20+build.1',
  '1.19.4': '1.19.4+build.2',
  '1.19.3': '1.19.3+build.1',
  '1.19.2': '1.19.2+build.1',
  '1.19.1': '1.19.1+build.1',
  '1.19': '1.19+build.1',
  '1.18.2': '1.18.2+build.4',
  '1.18.1': '1.18.1+build.1',
  '1.18': '1.18+build.1',
  '1.17.1': '1.17.1+build.1',
  '1.17': '1.17+build.1',
  '1.16.5': '1.16.5+build.1',
  'default': '1.20.4+build.3',
};

// ✅ GET LOOM VERSION
function getLoomVersion(mcVersion: string): string {
  for (const [prefix, version] of Object.entries(FABRIC_LOOM_VERSIONS)) {
    if (mcVersion.startsWith(prefix)) {
      return version;
    }
  }
  return FABRIC_LOOM_VERSIONS['default'];
}

// ✅ GET API VERSION
function getApiVersion(mcVersion: string): string {
  if (FABRIC_API_VERSIONS[mcVersion]) {
    return FABRIC_API_VERSIONS[mcVersion];
  }
  return FABRIC_API_VERSIONS['default'];
}

// ✅ GET MAPPINGS VERSION
function getMappingsVersion(mcVersion: string): string {
  if (MAPPINGS_VERSIONS[mcVersion]) {
    return MAPPINGS_VERSIONS[mcVersion];
  }
  return MAPPINGS_VERSIONS['default'];
}

// ✅ JAVA & GRADLE VERSION
function getJavaAndGradleVersion(mcVersion: string): { java: string, gradle: string } {
  const parts = mcVersion.split('.');
  const major = parseInt(parts[0] || '1');
  const minor = parseInt(parts[1] || '0');
  const patch = parseInt(parts[2] || '0');

  if ((major === 1 && minor >= 21) || (major === 1 && minor === 20 && patch >= 5)) {
    return { java: '21', gradle: '8.14' };
  }
  if (major === 1 && minor >= 18) {
    return { java: '17', gradle: '8.5' };
  }
  if (major === 1 && minor === 17) {
    return { java: '16', gradle: '7.6' };
  }
  return { java: '8', gradle: '6.8.3' };
}

interface GenerateOptions {
  name: string;
  slug?: string;
  platform: string;
  loader: string;
  minecraftVersion: string;
  templateId: string;
  packageName?: string;
  modId?: string;
  author?: string;
  version?: string;
  loaderMinecraftVersionId?: string;
  
  customLoaderVersion?: string;
  customApiVersion?: string;
  customLoomVersion?: string;
  customJavaVersion?: string;
  customGradleVersion?: string;
  customMappingsVersion?: string;

  userId: string;
  send: (event: any) => void;
}

export async function generateProject(options: GenerateOptions): Promise<{
  project: any;
  fileStructure: FileNode[];
  totalFiles: number;
}> {
  const {
    name,
    slug,
    platform,
    loader,
    minecraftVersion,
    templateId,
    packageName,
    modId,
    author,
    version,
    loaderMinecraftVersionId,
    
    customLoaderVersion,
    customApiVersion,
    customLoomVersion,
    customJavaVersion,
    customGradleVersion,
    customMappingsVersion,
    
    userId,
    send,
  } = options;

  send({ type: "log", message: "Fetching template..." });
  
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    include: {
      templateRepo: true,
      mcVersionData: true,
      LoaderMinecraftVersion: true,
    },
  });

  if (!template) {
    send({ type: "error", message: "Template not found" });
    throw new Error("Template not found");
  }

  send({ type: "log", message: `Template found: ${template.name}` });
  send({ type: "log", message: `Template path: ${template.path}` });

  // Get loader version data
  let loaderVersionData: any = null;
  if (loaderMinecraftVersionId) {
    loaderVersionData = await prisma.loaderMinecraftVersion.findUnique({
      where: { id: loaderMinecraftVersionId },
    });
  }

  // ✅ PRIORITAS: Custom > Database > Auto-detect
  const versionInfo = getJavaAndGradleVersion(minecraftVersion);
  
  const finalLoaderVersion = customLoaderVersion || loaderVersionData?.loaderVersion || "0.16.9";
  const finalFabricApiVersion = customApiVersion || loaderVersionData?.apiVersion || getApiVersion(minecraftVersion);
  const finalLoomVersion = customLoomVersion || loaderVersionData?.loomVersion || getLoomVersion(minecraftVersion);
  const finalGradleVersion = customGradleVersion || loaderVersionData?.gradleVersion || versionInfo.gradle;
  const finalJavaVersion = customJavaVersion || loaderVersionData?.javaVersion || versionInfo.java;
  const finalJdkVersion = customJavaVersion || loaderVersionData?.jdkVersion || versionInfo.java;
  const finalMappingsVersion = customMappingsVersion || loaderVersionData?.mappingsVersion || getMappingsVersion(minecraftVersion);

  // Generate clean names
  const cleanName = slugify(name).replace(/-/g, '').toLowerCase();
  
  const generatedPackageName = (packageName || `com.${cleanName}.mod`).toLowerCase();
  const generatedModId = (modId || cleanName).toLowerCase();
  
  const className = generatedModId.charAt(0).toUpperCase() + generatedModId.slice(1) + 'Mod';
  const clientClassName = generatedModId.charAt(0).toUpperCase() + generatedModId.slice(1) + 'ModClient';

  const data: GeneratorData = {
    name,
    slug: slug || slugify(name),
    platform,
    loader,
    minecraftVersion,
    packageName: generatedPackageName || "com.example.mod",
    modId: generatedModId || "examplemod",
    className: className || "ExampleMod",
    clientClassName: clientClassName || "ExampleModClient",
    author: author || "Unknown",
    version: version || "1.0.0",
    loaderVersion: finalLoaderVersion,
    fabricApiVersion: finalFabricApiVersion,
    loomVersion: finalLoomVersion,
    gradleVersion: finalGradleVersion,
    javaVersion: finalJavaVersion,
    jdkVersion: finalJdkVersion,
    mappingsVersion: finalMappingsVersion,
  };

  send({ type: "log", message: `Package: ${data.packageName}` });
  send({ type: "log", message: `Mod ID: ${data.modId}` });
  send({ type: "log", message: `Main Class: ${data.className}` });
  send({ type: "log", message: `Java Version: ${data.javaVersion}` });
  send({ type: "log", message: `Gradle Version: ${data.gradleVersion}` });
  send({ type: "log", message: `Loom Version: ${data.loomVersion}` });
  send({ type: "log", message: `API Version: ${data.fabricApiVersion}` });
  send({ type: "log", message: `Mappings: ${data.mappingsVersion}` });

  // Check for existing project with same slug
  let finalSlug = data.slug;
  const existingProject = await prisma.project.findFirst({
    where: {
      userId,
      slug: finalSlug,
    },
  });

  if (existingProject) {
    const timestamp = Date.now().toString().slice(-6);
    finalSlug = `${finalSlug}-${timestamp}`;
    data.slug = finalSlug;
    send({ type: "log", message: `⚠️ Slug already exists, using: ${finalSlug}` });
  }

  // Create project directory
  const projectDir = path.join(
    process.cwd(),
    "public",
    "projects",
    userId,
    data.slug
  );

  if (fs.existsSync(projectDir)) {
    send({ type: "log", message: `Removing existing project directory...` });
    fs.rmSync(projectDir, { recursive: true, force: true });
  }
  
  ensureDirectoryExists(projectDir);
  send({ type: "log", message: `Created project directory: ${projectDir}` });

  // Get template source
  const templateSourceDir = getTemplatePath(template);
  send({ type: "log", message: `Template source: ${templateSourceDir}` });

  // Clone template if needed
  if (!fs.existsSync(templateSourceDir)) {
    if (template.templateRepo?.repoUrl) {
      send({ type: "log", message: `Cloning template repository...` });
      send({ type: "log", message: `Repo URL: ${template.templateRepo.repoUrl}` });
      send({ type: "log", message: `Target: ${templateSourceDir}` });
      
      try {
        const parentDir = path.dirname(templateSourceDir);
        ensureDirectoryExists(parentDir);
        
        await execAsync(`git clone --depth 1 "${template.templateRepo.repoUrl}" "${templateSourceDir}"`);
        
        const gitPath = path.join(templateSourceDir, ".git");
        if (fs.existsSync(gitPath)) {
          fs.rmSync(gitPath, { recursive: true, force: true });
        }
        send({ type: "log", message: `Repository cloned successfully` });
      } catch (cloneError: any) {
        console.error("Clone error:", cloneError);
        const errorMsg = cloneError?.message || "Unknown error";
        send({ type: "error", message: `Failed to clone repository: ${errorMsg}` });
        throw new Error(`Failed to clone template repository: ${errorMsg}`);
      }
    } else {
      send({ type: "error", message: `Template source not found: ${templateSourceDir}` });
      throw new Error(`Template source not found at: ${templateSourceDir}`);
    }
  }

  if (!fs.existsSync(templateSourceDir)) {
    send({ type: "error", message: "Template source still not found after cloning" });
    throw new Error("Template source not found after cloning");
  }

  const sourceFiles = fs.readdirSync(templateSourceDir);
  send({ type: "log", message: `Found ${sourceFiles.length} items in template source` });
  
  if (sourceFiles.length === 0) {
    send({ type: "warning", message: "Template source is empty!" });
  } else {
    send({ type: "log", message: `Files: ${sourceFiles.join(', ')}` });
  }

  // Process files
  send({ type: "log", message: `Processing files from template...` });
  
  const fileStructure: FileNode[] = [];
  const processedFiles: string[] = [];

  try {
    await copyAndProcessFiles(
      templateSourceDir, 
      projectDir, 
      data,
      fileStructure,
      processedFiles,
      send
    );
  } catch (copyError: any) {
    console.error("Copy error:", copyError);
    send({ type: "error", message: `Failed to copy files: ${copyError?.message}` });
    throw new Error(`Failed to copy template files: ${copyError?.message}`);
  }

  send({ type: "log", message: `Processed ${processedFiles.length} files` });

  if (fs.existsSync(projectDir)) {
    const targetFiles = fs.readdirSync(projectDir);
    send({ type: "log", message: `Project directory now has ${targetFiles.length} items` });
    if (targetFiles.length === 0) {
      send({ type: "warning", message: "No files were copied to the project directory!" });
    }
  } else {
    send({ type: "error", message: "Project directory does not exist after copy!" });
  }

  // ✅ Save to database - PROJECT + CONFIG
  send({ type: "log", message: `Saving project to database...` });
  
  let project;
  try {
    project = await prisma.project.create({
      data: {
        name,
        slug: data.slug,
        description: `Generated from ${template.name}`,
        platform,
        loader,
        minecraftVersion,
        packageName: data.packageName,
        modId: data.modId,
        author: data.author,
        version: data.version,
        status: "DRAFT",
        visibility: "PRIVATE",
        userId,
        templateId: template.id,
      },
    });

    // ✅ TAMBAHKAN: Buat ProjectConfig
    await prisma.projectConfig.create({
      data: {
        projectId: project.id,
        loaderVersion: data.loaderVersion,
        fabricApiVersion: data.fabricApiVersion,
        loomVersion: data.loomVersion,
        javaVersion: data.javaVersion,
        gradleVersion: data.gradleVersion,
        mappingVersion: data.mappingsVersion,
        // yarnVersion: null, // Tidak digunakan untuk Fabric
      },
    });

    send({ type: "log", message: `✅ Project config created for ${project.name}` });
    
  } catch (dbError: any) {
    if (dbError.code === 'P2002') {
      const timestamp = Date.now().toString().slice(-6);
      const newSlug = `${data.slug}-${timestamp}`;
      
      send({ type: "log", message: `⚠️ Slug conflict, retrying with: ${newSlug}` });
      
      const newProjectDir = path.join(
        process.cwd(),
        "public",
        "projects",
        userId,
        newSlug
      );
      
      if (fs.existsSync(projectDir)) {
        fs.renameSync(projectDir, newProjectDir);
      }
      
      project = await prisma.project.create({
        data: {
          name,
          slug: newSlug,
          description: `Generated from ${template.name}`,
          platform,
          loader,
          minecraftVersion,
          packageName: data.packageName,
          modId: data.modId,
          author: data.author,
          version: data.version,
          status: "DRAFT",
          visibility: "PRIVATE",
          userId,
          templateId: template.id,
        },
      });

      // ✅ Buat config untuk project baru
      await prisma.projectConfig.create({
        data: {
          projectId: project.id,
          loaderVersion: data.loaderVersion,
          fabricApiVersion: data.fabricApiVersion,
          loomVersion: data.loomVersion,
          javaVersion: data.javaVersion,
          gradleVersion: data.gradleVersion,
          mappingVersion: data.mappingsVersion,
        },
      });
      
      send({ type: "log", message: `✅ Project config created for ${project.name}` });
    } else {
      throw dbError;
    }
  }

  send({ type: "log", message: `Project saved: ${project.name} (ID: ${project.id})` });
  send({ type: "log", message: `Total files generated: ${processedFiles.length}` });

  return {
    project,
    fileStructure,
    totalFiles: processedFiles.length,
  };
}