// app/api/user/generator/generate/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateProject } from "@/lib/template-generator/fabric/generator";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
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

    const {
      name,
      slug,
      platform,
      loader,
      minecraftVersion,
      templateId,
      packageName,
      modId,
      author,
      version,
      loaderMinecraftVersionId,
      
      customLoaderVersion,
      customApiVersion,
      customLoomVersion,
      customJavaVersion,
      customGradleVersion,
      customMappingsVersion,
    } = body;

    if (!name || !templateId || !platform || !loader || !minecraftVersion) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: name, templateId, platform, loader, minecraftVersion" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ VALIDASI: Cek apakah Minecraft version ada di database
    const mcVersion = await prisma.minecraftVersion.findUnique({
      where: { version: minecraftVersion },
      include: {
        loaderVersions: {
          where: { loader: loader as any },
        },
      },
    });

    if (!mcVersion) {
      const availableVersions = await prisma.minecraftVersion.findMany({
        where: { platform: platform as any },
        select: { version: true },
        orderBy: { version: 'desc' },
        take: 10,
      });

      return new Response(JSON.stringify({ 
        error: `Minecraft version "${minecraftVersion}" is not supported.`,
        availableVersions: availableVersions.map(v => v.version),
        suggestion: `Please select from: ${availableVersions.map(v => v.version).join(', ')}`
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ VALIDASI: Cek apakah loader supported
    const supportedLoaders = ["FABRIC", "FORGE", "NEOFORGE", "QUILT"];
    if (!supportedLoaders.includes(loader)) {
      return new Response(JSON.stringify({ 
        error: `Loader "${loader}" is not supported for direct generation. Supported loaders: ${supportedLoaders.join(", ")}` 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    let closed = false;

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: Record<string, any>) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch (error) {
            console.error("Error sending event:", error);
          }
        };

        const finish = () => {
          if (closed) return;
          closed = true;
          try { 
            controller.close(); 
          } catch (error) {
            console.error("Error closing stream:", error);
          }
        };

        const timeoutId = setTimeout(() => {
          if (!closed) {
            send({ 
              type: "error", 
              message: "Project generation timed out after 5 minutes" 
            });
            finish();
          }
        }, 5 * 60 * 1000);

        try {
          const result = await generateProject({
            name,
            slug,
            platform,
            loader,
            minecraftVersion,
            templateId,
            packageName,
            modId,
            author,
            version,
            loaderMinecraftVersionId,
            
            customLoaderVersion,
            customApiVersion,
            customLoomVersion,
            customJavaVersion,
            customGradleVersion,
            customMappingsVersion,

            userId: session.user.id,
            send,
          });

          clearTimeout(timeoutId);

          send({ 
            type: "done",
            project: result.project,
            fileStructure: result.fileStructure,
            totalFiles: result.totalFiles,
            message: `✨ Project generated successfully! (${result.totalFiles} files)`
          });

          finish();
        } catch (error) {
          console.error("Error generating project:", error);
          send({ 
            type: "error", 
            message: error instanceof Error ? error.message : "Failed to generate project",
            stack: process.env.NODE_ENV === "development" ? (error as Error).stack : undefined
          });
          finish();
        }
      },
      cancel() { 
        closed = true; 
        console.log("Stream cancelled by client");
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
  } catch (error) {
    console.error("Fatal error in generate route:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}