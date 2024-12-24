import { NextResponse } from "next/server";
import prisma from "@/db/db.config";
import { Prisma, ProjectStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    // Parse and validate the request body
    let body;
    try {
      body = await request.json();
      console.log("Received raw project data:", body);
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return NextResponse.json(
        { error: "Invalid request body format" },
        { status: 400 }
      );
    }

    const { name, status, tools, startDate, endDate } = body;

    // Validate required fields
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required and must be a string" },
        { status: 400 }
      );
    }

    if (
      !status ||
      !Object.values(ProjectStatus).includes(status as ProjectStatus)
    ) {
      return NextResponse.json(
        { error: "Valid status is required (PLANNING, ACTIVE, or COMPLETED)" },
        { status: 400 }
      );
    }

    if (!Array.isArray(tools)) {
      return NextResponse.json(
        { error: "Tools must be an array" },
        { status: 400 }
      );
    }

    if (!startDate || !isValidDate(startDate)) {
      return NextResponse.json(
        { error: "Valid start date is required" },
        { status: 400 }
      );
    }

    // Validate end date if provided
    if (endDate && !isValidDate(endDate)) {
      return NextResponse.json(
        { error: "Invalid end date format" },
        { status: 400 }
      );
    }

    // Create the project
    const newProject = await prisma.project.create({
      data: {
        name: name.trim(),
        status: status as ProjectStatus,
        tools: tools.map((t) => t.trim()).filter((t) => t.length > 0),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        assignments: {
          include: {
            employee: true,
          },
        },
      },
    });

    console.log("Successfully created project:", newProject);
    return NextResponse.json(newProject);
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      {
        error: "Failed to create project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to validate date strings
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const status = searchParams.get("status") as ProjectStatus | "ALL" | null;

    const whereClause: Prisma.ProjectWhereInput = {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { tools: { hasSome: query.split(",").map((t) => t.trim()) } },
      ],
    };

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
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
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch projects",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, status, tools, startDate, endDate } = body;

    // Validate required fields
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required and must be a string" },
        { status: 400 }
      );
    }

    if (
      !status ||
      !Object.values(ProjectStatus).includes(status as ProjectStatus)
    ) {
      return NextResponse.json(
        { error: "Valid status is required (PLANNING, ACTIVE, or COMPLETED)" },
        { status: 400 }
      );
    }

    if (!Array.isArray(tools)) {
      return NextResponse.json(
        { error: "Tools must be an array" },
        { status: 400 }
      );
    }

    if (!startDate || !isValidDate(startDate)) {
      return NextResponse.json(
        { error: "Valid start date is required" },
        { status: 400 }
      );
    }

    if (endDate && !isValidDate(endDate)) {
      return NextResponse.json(
        { error: "Invalid end date format" },
        { status: 400 }
      );
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: Number(id) },
      data: {
        name: name.trim(),
        status: status as ProjectStatus,
        tools: tools.map((t) => t.trim()).filter((t) => t.length > 0),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        assignments: {
          include: {
            employee: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json(
      {
        error: "Failed to update project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
