// app/api/admin/templates/clone/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import os from "os";
import simpleGit from 'simple-git';
import { processClonedTemplate } from "@/lib/templates/fabric/clone-processor";
import { put, del, list } from '@vercel/blob';
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    'json': 'application/json',
    'js': 'application/javascript',
    'ts': 'application/typescript',
    'java': 'text/plain',
    'gradle': 'text/plain',
    'properties': 'text/plain',
    'toml': 'application/toml',
    'xml': 'application/xml',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'yml': 'application/yaml',
    'yaml': 'application/yaml',
  };
  return types[ext || ''] || 'application/octet-stream';
}

async function uploadDirectoryToBlob(localPath: string, blobPath: string) {
  const uploadedFiles = [];
  const errors = [];

  // Baca semua file di direktori
  const files = fs.readdirSync(localPath, { recursive: true });
  
  for (const file of files) {
    const fullPath = path.join(localPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isFile()) {
      try {
        const fileContent = fs.readFileSync(fullPath);
        const blobPathname = `${blobPath}/${file}`;
        
        const blob = await put(
          blobPathname,
          fileContent,
          {
            access: 'public',
            contentType: getContentType(file),
            addRandomSuffix: false,
          }
        );
        
        uploadedFiles.push({
          path: file,
          url: blob.url,
          size: stat.size,
        });
      } catch (error) {
        errors.push({
          path: file,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  return { uploadedFiles, errors };
}

async function deleteTemplateFromBlob(blobPath: string) {
  try {
    const { blobs } = await list({ prefix: blobPath });
    for (const blob of blobs) {
      await del(blob.url);
    }
    return { success: true, deleted: blobs.length };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function cloneRepositoryWithSimpleGit(repoUrl: string, targetPath: string, onProgress?: (message: string) => void) {
  const git = simpleGit({
    baseDir: targetPath,
    binary: 'git',
    maxConcurrentProcesses: 1,
  });

  // Clone with depth 1
  await git.clone(repoUrl, targetPath, ['--depth', '1']);
  
  // Get the remote URL
  const remotes = await git.getRemotes(true);
  return remotes;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { repoUrl, templateName, platform, loader, minecraftVersion, loaderVersion } = body;

  if (!repoUrl || !templateName || !platform || !loader || !minecraftVersion) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const platformLower = platform.toLowerCase();
  const loaderLower = loader.toLowerCase();

  // ✅ GUNAKAN TEMPORARY DIRECTORY UNTUK CLONING
  const tempDir = path.join(os.tmpdir(), `template-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  const fullPath = tempDir;

  // Blob path
  const blobPath = `templates/${platformLower}/${loaderLower}/${minecraftVersion}`;

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: Record<string, any>) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // controller might already be closed
        }
      };

      const finish = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // no-op
        }
      };

      (async () => {
        try {
          // 1. Hapus template dari blob jika sudah ada
          send({ type: "log", message: `🗑️ Checking existing template in blob...` });
          const deleteResult = await deleteTemplateFromBlob(blobPath);
          if (deleteResult.success) {
            send({ type: "log", message: `✅ Removed ${deleteResult.deleted} files from blob` });
          } else if (deleteResult.error) {
            send({ type: "log", message: `⚠️ No existing template found or error: ${deleteResult.error}` });
          }

          // 2. Buat temporary directory
          if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          }
          fs.mkdirSync(fullPath, { recursive: true });
          send({ type: "log", message: `📁 Created temporary directory: ${fullPath}` });

          // 3. Clone repository menggunakan simple-git
          send({ type: "log", message: `🔄 Cloning repository: ${repoUrl}` });
          send({ type: "log", message: `$ git clone --depth 1 ${repoUrl} ${fullPath}` });

          try {
            // Clone repository
            const git = simpleGit({
              baseDir: path.dirname(fullPath),
              binary: 'git',
            });

            // Clone with progress
            await git.clone(repoUrl, fullPath, ['--depth', '1'], (update) => {
              send({ type: "log", message: update });
            });

            send({ type: "log", message: `✅ Clone completed successfully` });
          } catch (cloneError: any) {
            send({ type: "error", message: `❌ Clone failed: ${cloneError.message}` });
            if (fs.existsSync(fullPath)) {
              fs.rmSync(fullPath, { recursive: true, force: true });
            }
            finish();
            return;
          }

          // 4. Proses hasil clone
          send({ type: "log", message: `🔄 Processing cloned template for Minecraft ${minecraftVersion}...` });

          const result = processClonedTemplate({
            templatePath: fullPath,
            templateName,
            minecraftVersion,
            loaderVersion: loaderVersion || "0.16.9",
            platform,
            loader,
          });

          if (!result.success) {
            send({ type: "error", message: result.message });
            finish();
            return;
          }

          // Kirim log hasil processing
          if (result.modifiedFiles && result.modifiedFiles.length > 0) {
            send({ type: "log", message: `📝 Modified: ${result.modifiedFiles.length} files` });
            result.modifiedFiles.forEach((f: string) => send({ type: "log", message: `   - ${f}` }));
          }
          if (result.addedFiles && result.addedFiles.length > 0) {
            send({ type: "log", message: `➕ Added: ${result.addedFiles.length} files` });
            result.addedFiles.forEach((f: string) => send({ type: "log", message: `   - ${f}` }));
          }
          if (result.removedFiles && result.removedFiles.length > 0) {
            send({ type: "log", message: `❌ Removed: ${result.removedFiles.length} files` });
            result.removedFiles.forEach((f: string) => send({ type: "log", message: `   - ${f}` }));
          }

          // 5. Hapus .git folder
          const gitPath = path.join(fullPath, ".git");
          if (fs.existsSync(gitPath)) {
            fs.rmSync(gitPath, { recursive: true, force: true });
            send({ type: "log", message: "🗑️ Removed .git directory" });
          }

          // 6. Upload ke Vercel Blob
          send({ type: "log", message: `☁️ Uploading to Vercel Blob: ${blobPath}` });
          
          const uploadResult = await uploadDirectoryToBlob(fullPath, blobPath);
          
          if (uploadResult.errors.length > 0) {
            send({ 
              type: "warning", 
              message: `⚠️ ${uploadResult.errors.length} files failed to upload` 
            });
            uploadResult.errors.forEach((err) => {
              send({ type: "log", message: `   ❌ ${err.path}: ${err.error}` });
            });
          }

          send({ 
            type: "log", 
            message: `✅ Uploaded ${uploadResult.uploadedFiles.length} files to Vercel Blob` 
          });

          // 7. Hapus temporary directory setelah upload
          if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            send({ type: "log", message: "🗑️ Removed temporary directory" });
          }

          // 8. Simpan metadata ke database
          const template = await prisma.template.create({
            data: {
              name: templateName,
              platform: platformLower,
              loader: loaderLower,
              minecraftVersion,
              loaderVersion: loaderVersion || "0.16.9",
              blobPath,
              repoUrl,
              fileCount: uploadResult.uploadedFiles.length,
              userId: session.user.id,
              isActive: true,
            },
          });

          // 9. Cek gradle
          let gradleUrl = "";
          const hasGradle = uploadResult.uploadedFiles.some(
            (f) => f.path === "build.gradle" || f.path === "build.gradle.kts"
          );
          if (hasGradle) {
            gradleUrl = repoUrl.replace(/\.git$/, "");
          }

          // 10. Kirim event selesai
          send({
            type: "done",
            path: blobPath,
            gradleUrl: gradleUrl || repoUrl,
            message: `✅ Template successfully uploaded to Vercel Blob for Minecraft ${minecraftVersion}`,
            uploadedFiles: uploadResult.uploadedFiles.length,
            templateId: template.id,
            blobUrl: `/api/templates/${blobPath}`,
          });
          
          finish();
        } catch (error: any) {
          send({ type: "error", message: error.message || "Failed to clone repository" });
          // Cleanup on error
          if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          }
          finish();
        }
      })();
    },
    cancel() {
      closed = true;
      // Cleanup on cancel
      if (fs.existsSync(fullPath)) {
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } catch {
          // ignore
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}