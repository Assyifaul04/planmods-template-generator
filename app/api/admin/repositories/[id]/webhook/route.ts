// app/api/admin/repositories/[id]/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Octokit } from "@octokit/rest";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // "create", "update", "delete"

    const repository = await prisma.githubRepository.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    let webhookId = repository.webhookId;
    let webhookSecret = repository.webhookSecret;

    // Get GitHub token from session
    const githubToken = session.user?.githubAccessToken || session.githubAccessToken;
    
    if (githubToken && repository.repositoryUrl) {
      try {
        const octokit = new Octokit({ auth: githubToken });
        
        // Extract owner and repo from URL
        const urlParts = repository.repositoryUrl
          .replace("https://github.com/", "")
          .replace(".git", "")
          .split("/");
        
        if (urlParts.length >= 2) {
          const owner = urlParts[0];
          const repo = urlParts.slice(1).join("/");

          if (action === "create" || action === "update") {
            const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/api/github/webhook`;
            
            if (action === "create") {
              // Create webhook
              const { data: webhook } = await octokit.repos.createWebhook({
                owner,
                repo,
                name: 'web',
                config: {
                  url: webhookUrl,
                  content_type: 'json',
                  secret: process.env.GITHUB_WEBHOOK_SECRET || undefined,
                },
                events: ['push', 'pull_request', 'release'],
                active: true,
              });
              
              webhookId = webhook.id.toString();
              webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || null;
            } else if (action === "update" && repository.webhookId) {
              // Update webhook
              await octokit.repos.updateWebhook({
                owner,
                repo,
                hook_id: parseInt(repository.webhookId),
                config: {
                  url: webhookUrl,
                  content_type: 'json',
                  secret: process.env.GITHUB_WEBHOOK_SECRET || undefined,
                },
                events: ['push', 'pull_request', 'release'],
                active: true,
              });
            }
          } else if (action === "delete" && repository.webhookId) {
            // Delete webhook
            await octokit.repos.deleteWebhook({
              owner,
              repo,
              hook_id: parseInt(repository.webhookId),
            });
            webhookId = null;
            webhookSecret = null;
          }
        }
      } catch (githubError) {
        console.error("GitHub API error:", githubError);
        // Continue with database update even if GitHub API fails
        // We'll still update the database with the new state
      }
    }

    // Update database
    const updatedRepository = await prisma.githubRepository.update({
      where: { id },
      data: {
        webhookId,
        webhookSecret,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `${action.toUpperCase()}_WEBHOOK_${id}`,
        metadata: {
          repositoryName: repository.repositoryName,
          repositoryId: repository.id,
          webhookId,
          action,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Webhook ${action}ed successfully`,
      repository: updatedRepository,
    });
  } catch (error) {
    console.error("Error managing webhook:", error);
    return NextResponse.json(
      { error: "Failed to manage webhook" },
      { status: 500 }
    );
  }
}