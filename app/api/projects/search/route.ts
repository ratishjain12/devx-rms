import { NextResponse } from "next/server";
import prisma from "@/db/db.config";
import { Prisma, ProjectStatus } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const status = (searchParams.get("status") as ProjectStatus | "ALL") || "ALL";

  try {
    const whereClause: Prisma.ProjectWhereInput = {
      OR: [{ name: { contains: q, mode: "insensitive" } }],
    };

    if (status !== "ALL") {
      whereClause.status = status as ProjectStatus;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        assignments: {
          include: {
            employee: true,
          },
        },
        projectRequirements: {
          include: {
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error searching projects:", error);
    return NextResponse.json(
      {
        error: "Failed to search projects",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
