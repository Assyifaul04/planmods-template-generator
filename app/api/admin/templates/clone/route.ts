// app/api/admin/templates/clone/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { repoUrl, templateName, platform, loader, minecraftVersion } = body;

    if (!repoUrl || !templateName || !platform || !loader || !minecraftVersion) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
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

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    const existingFiles = fs.readdirSync(fullPath);
    if (existingFiles.length > 0) {
      return NextResponse.json(
        { error: "Directory already exists and is not empty" },
        { status: 400 }
      );
    }

    try {
      const cloneCommand = `git clone --depth 1 ${repoUrl} ${fullPath}`;
      await execAsync(cloneCommand);
      
      const gitPath = path.join(fullPath, ".git");
      if (fs.existsSync(gitPath)) {
        fs.rmSync(gitPath, { recursive: true, force: true });
      }

      let gradleUrl = "";
      const files = fs.readdirSync(fullPath);
      if (files.some(f => f === "build.gradle" || f === "build.gradle.kts")) {
        gradleUrl = repoUrl.replace(/\.git$/, "");
      }

      return NextResponse.json({
        success: true,
        path: templatePath.replace(/\\/g, "/"),
        gradleUrl: gradleUrl || repoUrl,
        message: `Repository cloned successfully to ${templatePath}`,
      });
    } catch (cloneError: any) {
      console.error("Clone error:", cloneError);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
      return NextResponse.json(
        { error: `Failed to clone repository: ${cloneError.message || "Unknown error"}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error cloning repository:", error);
    return NextResponse.json(
      { error: "Failed to clone repository" },
      { status: 500 }
    );
  }
}