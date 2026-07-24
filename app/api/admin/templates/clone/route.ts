// app/api/admin/templates/clone/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { processClonedTemplate } from "@/lib/templates/fabric/clone-processor";

export const dynamic = "force-dynamic";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

  const templatePath = path.join(
    "public",
    "templates",
    platformLower,
    loaderLower,
    minecraftVersion
  );

  const fullPath = path.join(process.cwd(), templatePath);

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

      try {
        // Hapus folder jika sudah ada
        if (fs.existsSync(fullPath)) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          send({
            type: "log",
            message: `Removed existing directory`,
          });
        }

        fs.mkdirSync(fullPath, { recursive: true });
        send({
          type: "log",
          message: `Created directory ${templatePath.replace(/\\/g, "/")}`,
        });

        send({ type: "log", message: `$ git clone --depth 1 ${repoUrl} ${templatePath}` });

        const child = spawn("git", ["clone", "--progress", "--depth", "1", repoUrl, fullPath]);

        const emitLines = (data: Buffer) => {
          data
            .toString()
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean)
            .forEach((line) => send({ type: "log", message: line }));
        };

        child.stdout.on("data", emitLines);
        child.stderr.on("data", emitLines);

        child.on("error", (err) => {
          send({ type: "error", message: `Failed to start git: ${err.message}` });
          if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          }
          finish();
        });

        child.on("close", (code) => {
          if (code !== 0) {
            send({ type: "error", message: `git clone exited with code ${code}` });
            if (fs.existsSync(fullPath)) {
              fs.rmSync(fullPath, { recursive: true, force: true });
            }
            finish();
            return;
          }

          try {
            // ============================================
            // ✅ PROSES HASIL CLONE AGAR SESUAI VERSI
            // ============================================
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

            // Hapus .git folder (jika masih ada)
            const gitPath = path.join(fullPath, ".git");
            if (fs.existsSync(gitPath)) {
              fs.rmSync(gitPath, { recursive: true, force: true });
              send({ type: "log", message: "Removed .git directory" });
            }

            let gradleUrl = "";
            const files = fs.readdirSync(fullPath);
            if (files.some((f) => f === "build.gradle" || f === "build.gradle.kts")) {
              gradleUrl = repoUrl.replace(/\.git$/, "");
            }

            // ✅ PERBAIKAN: Kirim event done dengan data yang aman
            send({
              type: "done",
              path: templatePath.replace(/\\/g, "/"),
              gradleUrl: gradleUrl || repoUrl,
              message: `✅ Template processed successfully for Minecraft ${minecraftVersion}`,
              modifiedFiles: result.modifiedFiles || [],
              addedFiles: result.addedFiles || [],
              removedFiles: result.removedFiles || [],
            });
            
            finish();
          } catch (postError: any) {
            send({
              type: "error",
              message: `Post-clone error: ${postError.message || "Unknown error"}`,
            });
            finish();
          }
        });
      } catch (error: any) {
        send({ type: "error", message: error.message || "Failed to clone repository" });
        finish();
      }
    },
    cancel() {
      closed = true;
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