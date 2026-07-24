// lib/templates-generator/fabric/helpers.ts
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

export const execAsync = promisify(exec);

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  content?: string;
  children?: FileNode[];
}

export interface GeneratorData {
  name: string;
  slug: string;
  platform: string;
  loader: string;
  minecraftVersion: string;
  packageName: string;
  modId: string;
  className: string;
  clientClassName: string;
  author: string;
  version: string;
  loaderVersion: string;
  fabricApiVersion?: string;
  loomVersion?: string;
  gradleVersion?: string;
  javaVersion?: string;
  jdkVersion?: string;
  mappingsVersion?: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getTemplatePath(template: any): string {
  const templatePath = path.join(
    process.cwd(),
    "public",
    "templates",
    template.platform.toLowerCase(),
    template.loader.toLowerCase(),
    template.minecraftVersion
  );
  
  console.log(`Template path: ${templatePath}`);
  console.log(`Template exists: ${fs.existsSync(templatePath)}`);
  
  return templatePath;
}