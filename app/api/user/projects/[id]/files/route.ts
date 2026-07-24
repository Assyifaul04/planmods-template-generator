// app/api/user/projects/[id]/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Helper: Cari file pertama dalam tree
function findFirstFile(nodes: any[]): any | null {
  for (const node of nodes) {
    if (node.type === "file") {
      return node;
    }
    if (node.children) {
      const found = findFirstFile(node.children);
      if (found) return found;
    }
  }
  return null;
}

// Helper: Build file tree dari list path
function buildFileTree(items: { path: string; content?: string; isFolder?: boolean }[]): any[] {
  const root: any[] = [];

  items.forEach((item) => {
    const parts = item.path.split(/[\\/]/);
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      let node = currentLevel.find((n) => n.name === part);

      if (!node) {
        const isFolderNode = !isLast || item.isFolder;

        node = {
          name: part,
          path: parts.slice(0, index + 1).join("/"),
          type: isFolderNode ? "folder" : "file",
          children: isFolderNode ? [] : undefined,
        };

        if (!isFolderNode) {
          node.content = item.content || "";
        }

        currentLevel.push(node);
      }

      if (node.children) {
        currentLevel = node.children;
      }
    });
  });

  // Sort nodes
  const sortNodes = (nodes: any[]): any[] => {
    return nodes
      .sort((a, b) => {
        if (a.type === "folder" && b.type === "file") return -1;
        if (a.type === "file" && b.type === "folder") return 1;
        return a.name.localeCompare(b.name);
      })
      .map((node) => {
        if (node.children) {
          node.children = sortNodes(node.children);
        }
        return node;
      });
  };

  return sortNodes(root);
}

// Helper: Baca file dengan aman
function readFileSafe(filePath: string, maxSize: number = 500 * 1024): string {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > maxSize) {
      return `// File too large (${(stats.size / 1024).toFixed(1)} KB). Max size: ${maxSize / 1024} KB`;
    }
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    return `// Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get project
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        userId: true,
        slug: true,
        templateId: true,
        platform: true,
        loader: true,
        minecraftVersion: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check access
    const isOwner = project.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const isCollaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId: id,
        userId: session.user.id,
      },
    });

    if (!isOwner && !isAdmin && !isCollaborator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get project directory
    const projectDir = path.join(
      process.cwd(),
      "public",
      "projects",
      project.userId,
      project.slug
    );

    if (!fs.existsSync(projectDir)) {
      return NextResponse.json({
        fileStructure: [],
        message: "Project directory not found",
      });
    }

    // Walk directory
    const items: { path: string; content?: string; isFolder?: boolean }[] = [];

    function walkDir(dir: string, basePath: string = "") {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        // ✅ PERBAIKAN: Hanya skip file/folder yang benar-benar tidak perlu
        // Jangan skip semua dotfile, hanya skip .git, .DS_Store, dll
        if (entry.name === ".git" || entry.name === ".DS_Store" || entry.name === "node_modules") {
          continue;
        }
        
        // ✅ PERBAIKAN: Jangan skip .github, .gitignore, .gitattributes, dll
        // Dotfiles yang penting tetap ditampilkan

        const fullPath = path.join(dir, entry.name);
        const relativePath = basePath ? path.join(basePath, entry.name) : entry.name;

        if (entry.isDirectory()) {
          items.push({ path: relativePath, isFolder: true });
          walkDir(fullPath, relativePath);
        } else {
          // Check if file is binary
          const ext = path.extname(entry.name).toLowerCase();
          const binaryExtensions = [
            ".jar", ".zip", ".png", ".jpg", ".jpeg", ".gif", 
            ".ico", ".class", ".dll", ".so", ".bin"
          ];
          
          if (binaryExtensions.includes(ext)) {
            items.push({ path: relativePath });
          } else {
            const content = readFileSafe(fullPath);
            items.push({ path: relativePath, content });
          }
        }
      }
    }

    walkDir(projectDir);

    // Build file tree
    const fileStructure = buildFileTree(items);

    // Find first file for preview
    const firstFile = findFirstFile(fileStructure);

    return NextResponse.json({
      fileStructure,
      firstFile,
      totalItems: items.length,
    });
  } catch (error) {
    console.error("Error fetching project files:", error);
    return NextResponse.json(
      { error: "Failed to fetch project files" },
      { status: 500 }
    );
  }
}