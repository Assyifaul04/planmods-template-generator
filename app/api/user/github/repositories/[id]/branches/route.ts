// app/api/user/github/repositories/[id]/branches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Octokit } from "@octokit/rest";

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

    const repository = await prisma.githubRepository.findUnique({
      where: { id },
    });

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    if (repository.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const githubToken = session.githubAccessToken as string;
    if (!githubToken) {
      return NextResponse.json(
        { error: "GitHub token not found" },
        { status: 401 }
      );
    }

    const octokit = new Octokit({ auth: githubToken });
    const [owner, repo] = repository.repositoryUrl
      .replace("https://github.com/", "")
      .split("/");

    const response = await octokit.repos.listBranches({
      owner,
      repo,
    });

    const branches = await Promise.all(
      response.data.map(async (branch) => {
        const protection = await octokit.repos.getBranchProtection({
          owner,
          repo,
          branch: branch.name,
        }).catch(() => null);

        return {
          name: branch.name,
          commit: branch.commit,
          protected: !!protection,
        };
      })
    );

    return NextResponse.json({ branches });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 }
    );
  }
}