// app/api/admin/repositories/[id]/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Octokit } from "@octokit/rest";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const repository = await prisma.githubRepository.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Sync dengan GitHub API
    try {
      const githubToken = session.githubAccessToken as string;
      if (githubToken) {
        const octokit = new Octokit({ auth: githubToken });
        const [owner, repo] = repository.repositoryUrl
          .replace("https://github.com/", "")
          .split("/");

        // Fetch repository info dari GitHub
        const { data: repoData } = await octokit.repos.get({
          owner,
          repo,
        });

        // Update repository info
        await prisma.githubRepository.update({
          where: { id },
          data: {
            repositoryName: repoData.name,
            repositoryUrl: repoData.html_url,
            cloneUrl: repoData.clone_url,
            defaultBranch: repoData.default_branch,
            private: repoData.private,
            lastSyncedAt: new Date(),
          },
        });
      }
    } catch (githubError) {
      console.error("GitHub API error:", githubError);
      // Jika gagal sync dengan GitHub, tetap update lastSyncedAt
      await prisma.githubRepository.update({
        where: { id },
        data: {
          lastSyncedAt: new Date(),
        },
      });
    }

    // Update lastSyncedAt
    const updatedRepository = await prisma.githubRepository.update({
      where: { id },
      data: {
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `SYNCED_REPOSITORY_${id}`,
        metadata: {
          repositoryName: repository.repositoryName,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Repository synced successfully",
      repository: updatedRepository,
    });
  } catch (error) {
    console.error("Error syncing repository:", error);
    return NextResponse.json(
      { error: "Failed to sync repository" },
      { status: 500 }
    );
  }
}