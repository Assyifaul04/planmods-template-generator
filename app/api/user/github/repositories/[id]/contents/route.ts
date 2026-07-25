// app/api/user/github/repositories/[id]/contents/route.ts
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
    const path = searchParams.get("path") || "";
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

    const cleanPath = path === "/" ? "" : path;

    try {
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path: cleanPath,
        ref: branch,
      });

      // ✅ Cast ke any terlebih dahulu untuk menghindari error TypeScript
      const data = response.data as any;

      // Handle array response (directory)
      if (Array.isArray(data)) {
        const contents = data.map((item: any) => ({
          name: item.name,
          path: item.path,
          sha: item.sha,
          size: item.size,
          url: item.url,
          html_url: item.html_url,
          git_url: item.git_url,
          download_url: item.download_url,
          type: item.type,
          _links: item._links,
        }));

        return NextResponse.json({ contents });
      }

      // Handle single file response
      let content = null;
      if (data && data.content) {
        try {
          // GitHub content adalah base64 encoded
          content = Buffer.from(data.content, "base64").toString("utf-8");
        } catch (decodeError) {
          console.error("Error decoding file content:", decodeError);
          content = "// Error decoding file content";
        }
      }

      return NextResponse.json({
        content,
        file: {
          name: data?.name || "",
          path: data?.path || "",
          sha: data?.sha || "",
          size: data?.size || 0,
          url: data?.url || "",
          html_url: data?.html_url || "",
          git_url: data?.git_url || "",
          download_url: data?.download_url || null,
          type: data?.type || "file",
          _links: data?._links || {},
        },
      });
    } catch (error: any) {
      console.error("GitHub API error:", error);
      if (error.status === 404) {
        return NextResponse.json({
          contents: [],
          message: "Path not found",
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error fetching contents:", error);
    return NextResponse.json(
      { error: "Failed to fetch contents" },
      { status: 500 }
    );
  }
}