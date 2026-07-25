// app/api/user/github/repositories/[id]/commits/route.ts
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
    const searchParams = request.nextUrl.searchParams;
    const branch = searchParams.get("branch") || "main";

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

    const response = await octokit.repos.listCommits({
      owner,
      repo,
      sha: branch,
      per_page: 30,
    });

    return NextResponse.json({ commits: response.data });
  } catch (error) {
    console.error("Error fetching commits:", error);
    return NextResponse.json(
      { error: "Failed to fetch commits" },
      { status: 500 }
    );
  }
}