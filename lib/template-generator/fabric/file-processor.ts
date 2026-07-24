// lib/templates-generator/fabric/file-processor.ts
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises"; // Lebih aman untuk stream memory-handling
import { FileNode, GeneratorData, ensureDirectoryExists } from "./helpers";
import { replacePlaceholders } from "./placeholder-replacer";

// File ekstensi binary - file besar seperti .jar akan di-copy langsung tanpa dibaca ke memory
const binaryExtensions = new Set([
  ".jar", ".zip", ".gz", ".xz", ".7z", ".rar", ".bin",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico",
  ".ogg", ".wav", ".mp3", ".flac", ".webm",
  ".ttf", ".otf", ".woff", ".woff2", ".eot",
  ".class", ".dll", ".exe", ".so",
  ".pdf",
]);

// File yang harus tetap di-copy sebagai binary
const forceBinaryFiles = new Set([
  "gradle-wrapper.jar",
  "gradlew",
  "gradlew.bat",
]);

// File yang harus di-skip
const skipFiles = new Set([
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
]);

// File yang dipaksa dibaca sebagai text
const forceTextFiles = new Set([
  ".gitignore",
  ".editorconfig",
  ".gitattributes",
  ".gitkeep",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "settings.gradle.kts",
  "gradle.properties",
]);

// Maksimum ukuran file untuk diproses sebagai text (500KB)
const MAX_TEXT_FILE_SIZE = 500 * 1024;

/**
 * Helper function untuk resolve path target.
 * Diekstrak agar rename folder/package berlaku konsisten untuk file Binary dan Text.
 */
function resolveTargetPath(relativePath: string, data: GeneratorData): string {
  let targetRelativePath = relativePath;
  const packagePath = (data.packageName || "com.example.mod").replace(/\./g, "/");

  targetRelativePath = targetRelativePath
    .replace(/com[\\/]+example[\\/]+mod/g, packagePath)
    .replace(/com[\\/]+example/g, packagePath)
    .replace(/net[\\/]+fabricmc[\\/]+example/g, packagePath);

  targetRelativePath = targetRelativePath
    .replace(/modid/g, data.modId || "examplemod")
    .replace(/examplemod/g, data.modId || "examplemod");

  const classPrefix = data.modId
    ? data.modId.charAt(0).toUpperCase() + data.modId.slice(1)
    : "Example";

  return targetRelativePath.replace(/Example/g, classPrefix);
}

export async function copyAndProcessFiles(
  sourceDir: string,
  targetDir: string,
  data: GeneratorData,
  fileStructure: FileNode[],
  processedFiles: string[],
  send: (event: any) => void
): Promise<void> {
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory does not exist: ${sourceDir}`);
    send({
      type: "error",
      message: `Template source not found: ${sourceDir}`,
    });
    return;
  }

  const createdFolders = new Set<string>();

  try {
    await walkAndProcess(
      sourceDir,
      targetDir,
      sourceDir,
      data,
      fileStructure,
      processedFiles,
      send,
      createdFolders
    );
  } catch (error) {
    console.error("Error in walkAndProcess:", error);
    send({
      type: "error",
      message: `Error processing files: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    throw error;
  }
}

async function walkAndProcess(
  currentDir: string,
  targetRootDir: string,
  sourceRootDir: string,
  data: GeneratorData,
  fileStructure: FileNode[],
  processedFiles: string[],
  send: (event: any) => void,
  createdFolders: Set<string>
): Promise<void> {
  // ✅ Menggunakan versi promise untuk mencegah blocking antrean utama NodeJS
  const entries = await fs.promises.readdir(currentDir, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (skipFiles.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(currentDir, entry.name);
    const relativePath = path.relative(sourceRootDir, sourcePath);

    // ✅ Resolve path di awal agar BERLAKU UNTUK SEMUA FILE (termasuk folder dan file binary)
    const targetRelativePath = resolveTargetPath(relativePath, data);
    const finalTargetPath = path.join(targetRootDir, targetRelativePath);

    // ===============================
    // Handle Directory
    // ===============================
    if (entry.isDirectory()) {
      if (!createdFolders.has(targetRelativePath)) {
        createdFolders.add(targetRelativePath);
        ensureDirectoryExists(finalTargetPath);

        if (fileStructure && Array.isArray(fileStructure)) {
          fileStructure.push({
            name: path.basename(finalTargetPath),
            path: targetRelativePath,
            type: "folder",
            children: [],
          });
        }

        send({
          type: "folder",
          path: targetRelativePath,
          name: path.basename(finalTargetPath),
        });
      }

      await walkAndProcess(
        sourcePath,
        targetRootDir,
        sourceRootDir,
        data,
        fileStructure,
        processedFiles,
        send,
        createdFolders
      );

      continue;
    }

    // ===============================
    // Handle File
    // ===============================
    const isForceBinary = forceBinaryFiles.has(entry.name);
    const extension = path.extname(entry.name).toLowerCase();
    const isForceText = forceTextFiles.has(entry.name) || forceTextFiles.has(extension);
    
    let isBinary = !isForceText && (binaryExtensions.has(extension) || isForceBinary);

    // Cek ukuran file secara asinkron
    let fileSize = 0;
    try {
      const stats = await fs.promises.stat(sourcePath);
      fileSize = stats.size;
    } catch (error) {
      console.error(`Error getting file size for ${entry.name}:`, error);
      isBinary = true; // Jika error baca ukuran, fallback ke binary untuk safety
    }

    const shouldTreatAsBinary = isBinary || (fileSize > MAX_TEXT_FILE_SIZE && !isForceText);

    ensureDirectoryExists(path.dirname(finalTargetPath));

    // ===============================
    // Binary File - COPY LANGSUNG
    // ===============================
    if (shouldTreatAsBinary) {
      try {
        await fs.promises.copyFile(sourcePath, finalTargetPath);
      } catch (error) {
        console.error(`Error copying binary file ${entry.name}, attempting stream fallback:`, error);
        try {
          const readStream = fs.createReadStream(sourcePath);
          const writeStream = fs.createWriteStream(finalTargetPath);
          // ✅ Menggunakan pipeline dari node:stream/promises mencegah memory leak jika gagal di tengah jalan
          await pipeline(readStream, writeStream); 
        } catch (streamError) {
          console.error(`Stream copy failed for ${entry.name}:`, streamError);
          throw streamError;
        }
      }
      
      const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
      if (process.env.NODE_ENV === "development" && fileSize > 1024 * 1024) {
        console.log(`✅ Binary file copied: ${entry.name} (${sizeInMB} MB)`);
      } else if (process.env.NODE_ENV === "development") {
        console.log(`✅ Binary file copied: ${entry.name} (${fileSize} bytes)`);
      }

      if (fileStructure && Array.isArray(fileStructure)) {
        fileStructure.push({
          name: path.basename(finalTargetPath),
          path: targetRelativePath,
          type: "file",
        });
      }

      if (processedFiles && Array.isArray(processedFiles)) {
        processedFiles.push(targetRelativePath);
      }

      send({
        type: "file",
        path: targetRelativePath,
        name: path.basename(finalTargetPath),
        binary: true,
        size: fileSize,
      });

      continue;
    }

    // ===============================
    // Text File - DENGAN PLACEHOLDER REPLACEMENT
    // ===============================
    try {
      // ✅ Tidak ada lagi limit size check redundan di sini yang tadinya membatalkan `forceTextFiles`
      let content = await fs.promises.readFile(sourcePath, "utf8");
      content = replacePlaceholders(content, data);
      await fs.promises.writeFile(finalTargetPath, content, "utf8");

      if (fileStructure && Array.isArray(fileStructure)) {
        fileStructure.push({
          name: path.basename(finalTargetPath),
          path: targetRelativePath,
          type: "file",
          content,
        });
      }

      if (processedFiles && Array.isArray(processedFiles)) {
        processedFiles.push(targetRelativePath);
      }

      send({
        type: "file",
        path: targetRelativePath,
        name: path.basename(finalTargetPath),
        content,
        size: Buffer.byteLength(content, "utf8"),
        binary: false,
      });
    } catch (readError) {
      console.error(`Error processing text file ${sourcePath}:`, readError);
      
      // Fallback: Jika terjadi masalah pada utf-8 read, salin paksa ke binary
      try {
        await fs.promises.copyFile(sourcePath, finalTargetPath);
        
        if (fileStructure && Array.isArray(fileStructure)) {
          fileStructure.push({
            name: path.basename(finalTargetPath),
            path: targetRelativePath,
            type: "file",
          });
        }

        if (processedFiles && Array.isArray(processedFiles)) {
          processedFiles.push(targetRelativePath);
        }

        const stat = await fs.promises.stat(finalTargetPath);
        send({
          type: "file",
          path: targetRelativePath,
          name: path.basename(finalTargetPath),
          binary: true,
          size: stat.size,
        });
      } catch (copyError) {
        console.error(`Failed to copy file as fallback ${sourcePath}:`, copyError);
        send({
          type: "error",
          message: `Failed to process file: ${entry.name}`,
        });
      }
    }
  }
}