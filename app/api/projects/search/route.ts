import { NextResponse } from "next/server";
import prisma from "@/db/db.config";
import { ProjectStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const status = searchParams.get("status");

    const projects = await prisma.project.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { tools: { has: query } },
            ],
          },
          status ? { status: status as ProjectStatus } : {},
        ],
      },
      include: {
        assignments: {
          include: {
            employee: true,
          },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to search projects" },
      { status: 500 }
    );
  }
}
