// app/api/user/github/deploy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Octokit } from "@octokit/rest";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Session:", {
      userId: session.user.id,
      githubId: session.githubId,
      hasToken: !!session.githubAccessToken,
      tokenLength: session.githubAccessToken?.length,
      githubUsername: session.githubUsername,
    });

    const body = await request.json();
    const { projectId, repoName, private: isPrivate } = body;

    if (!projectId || !repoName) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, repoName" },
        { status: 400 }
      );
    }

    const githubToken = session.githubAccessToken as string;
    
    if (!githubToken) {
      console.error("❌ No GitHub token found in session");
      return NextResponse.json(
        { 
          error: "GitHub access token not found. Please reconnect your GitHub account.",
          debug: { hasToken: false }
        },
        { status: 400 }
      );
    }

    try {
      const testOctokit = new Octokit({ auth: githubToken });
      await testOctokit.users.getAuthenticated();
    } catch (tokenError: any) {
      console.error("❌ Invalid GitHub token:", tokenError.message);
      return NextResponse.json(
        { 
          error: "GitHub token is invalid or expired. Please reconnect your GitHub account.",
          debug: { tokenError: tokenError.message }
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { githubId: true, githubUsername: true },
    });

    console.log("👤 User from DB:", user);

    if (!user?.githubId) {
      return NextResponse.json(
        { error: "GitHub account not connected" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        githubRepository: true,
      },
    });

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    if (project.githubRepository) {
      return NextResponse.json(
        { error: "Project already has a GitHub repository" },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: githubToken,
    });

    const owner = user.githubUsername || session.githubUsername || session.user.name || "user";
    console.log(`📦 Creating repository: ${owner}/${repoName}`);

    try {
      await octokit.repos.get({
        owner,
        repo: repoName,
      });
      
      return NextResponse.json(
        { error: `Repository "${repoName}" already exists` },
        { status: 422 }
      );
    } catch (error: any) {
      if (error.status !== 404) {
        throw error;
      }
    }

    // ✅ Buat repository KOSONG (tanpa README)
    const repo = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      private: isPrivate !== undefined ? isPrivate : true,
      description: project.description || `Generated from ${project.name}`,
      auto_init: false, // ✅ PASTIKAN false
    });

    console.log("✅ Repository created:", repo.data.html_url);

    const repoUrl = repo.data.html_url;
    const cloneUrl = repo.data.clone_url;

    const githubRepo = await prisma.githubRepository.create({
      data: {
        userId: session.user.id,
        projectId: project.id,
        repositoryName: repoName,
        repositoryUrl: repoUrl,
        cloneUrl: cloneUrl,
        defaultBranch: "main",
        private: isPrivate !== undefined ? isPrivate : true,
        lastSyncedAt: new Date(),
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "READY",
      },
    });

    return NextResponse.json({
      success: true,
      repoUrl,
      cloneUrl,
      repository: githubRepo,
      gitCommands: [
        `git remote add origin ${cloneUrl}`,
        `git branch -M main`,
        `git push -u origin main`,
      ],
      isPrivate: isPrivate !== undefined ? isPrivate : true,
      message: `Repository "${repoName}" created successfully!`,
    });
  } catch (error: any) {
    console.error("❌ Error deploying:", error);
    
    if (error.status === 422) {
      return NextResponse.json(
        { error: "Repository with this name already exists" },
        { status: 422 }
      );
    }

    if (error.status === 401) {
      return NextResponse.json(
        { error: "GitHub authentication failed. Please reconnect your GitHub account." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to deploy" },
      { status: 500 }
    );
  }
}